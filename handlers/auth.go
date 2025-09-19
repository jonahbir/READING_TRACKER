package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"reading-tracker/backend/models"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
	"go.mongodb.org/mongo-driver/mongo/options"

    "strconv"
)

// AuthHandler struct holds a reference to the MongoDB database
type AuthHandler struct {
	DB *mongo.Database
}

// Register function handles new user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {

	var input struct {
		Email             string `json:"email"`
		Password          string `json:"password"`
		Name              string `json:"name"`
		InsaBatch         string `json:"insa_batch"`
		DormNumber        string `json:"dorm_number"`
		EducationalStatus string `json:"educational_status"`
	}

	// Decode JSON request body into the input struct
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Get collections from MongoDB
	users := h.DB.Collection("users")
	pending := h.DB.Collection("pending_registrations")

	// Check if email is already registered
	if count, _ := users.CountDocuments(context.Background(), bson.M{"email": input.Email}); count > 0 {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}

	// Check if email is already pending approval
	if count, _ := pending.CountDocuments(context.Background(), bson.M{"email": input.Email}); count > 0 {
		http.Error(w, "Email pending approval", http.StatusConflict)
		return
	}

	// Hash the password for security before storing
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to process password", http.StatusInternalServerError)
		return
	}
	// genarate the reader_id 
	var reader_id string
	var userslist []models.User

			
	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "reader_id", Value: 1}}) 

	cursor, err := users.Find(context.Background(), bson.M{}, findOptions)
	if err != nil {
	http.Error(w,"error while generating1 id", http.StatusInternalServerError)
			}
	defer cursor.Close(context.Background())

     if err:=cursor.All(context.Background(), &userslist); err!=nil{
		http.Error(w,"error while genarating id", http.StatusInternalServerError)
	 }
	 // think how to generate it if it is the first user!
	 if len(userslist)==0{
		reader_id=input.Name[:3]+"0001"


	 }else{
		 targetedItem := userslist[len(userslist)-1]
		no := targetedItem.ReaderID[6:] // assuming email prefix is 5 chars
		num, err := strconv.ParseInt(no, 10, 64)
		if err != nil {
			http.Error(w, "error while generating id", http.StatusInternalServerError)
			return
		}
		id_num := num + 1
		reader_id = input.Name[:3] + "000" + strconv.FormatInt(id_num, 10)
	 }
     

	// Insert pending registration record into the database
	_, err = pending.InsertOne(context.Background(), models.PendingRegistration{
		Email:             input.Email,
		Password:          string(hashedPassword),
		ReaderID:          reader_id,
		Name:              input.Name,
		InsaBatch:         input.InsaBatch,
		DormNumber:        input.DormNumber,
		EducationalStatus: input.EducationalStatus,
		SubmittedAt:       time.Now(),
	})
	if err != nil {
		http.Error(w, "Failed to register", http.StatusInternalServerError)
		return
	}

	// Send response to user indicating pending approval
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Registration pending admin approval"})
}

// Login function handles user login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	// Define structure for login input
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	// Decode JSON request body
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Get users collection
	users := h.DB.Collection("users")
	var user models.User

	// Find the user by email
	err := users.FindOne(context.Background(), bson.M{"email": input.Email}).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Compare provided password with stored hashed password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Check if user account is verified
	if !user.Verified {
		http.Error(w, "Account not verified", http.StatusForbidden)
		return
	}

	// Create JWT token for authenticated user
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	// Sign the token with secret from environment variable
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Send token back to the client
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}

// ApproveUser function handles admin approval of pending registrations
func (h *AuthHandler) ApproveUser(w http.ResponseWriter, r *http.Request) {
	// Get token from Authorization header
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}
	// Remove "Bearer " prefix if present
	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	// Parse and verify JWT
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Extract claims and check admin role
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["role"] != "admin" {
		http.Error(w, "Admin access required", http.StatusForbidden)
		return
	}

	// Define input structure for email to approve
	var input struct {
		Email string `json:"email"`
	}

	// Decode JSON input
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Get pending registrations collection
	pending := h.DB.Collection("pending_registrations")
	var pendingUser models.PendingRegistration

	// Find the pending registration by email
	err = pending.FindOne(context.Background(), bson.M{"email": input.Email}).Decode(&pendingUser)
	if err != nil {
		http.Error(w, "Pending user not found", http.StatusNotFound)
		return
	}

	// Insert approved user into the "users" collection
	users := h.DB.Collection("users")
	_, err = users.InsertOne(context.Background(), models.User{
		Email:             pendingUser.Email,
		Password:          pendingUser.Password,
		Name:              pendingUser.Name,
		ReaderID:           pendingUser.ReaderID,
		Role:              "student",
		InsaBatch:         pendingUser.InsaBatch,
		DormNumber:        pendingUser.DormNumber,
		EducationalStatus: pendingUser.EducationalStatus,
		Verified:          true,
		BooksRead:         0,
		RankScore:         0,
		ClassTag:          "beginner",
		CreatedAt:         time.Now(),
	})
	if err != nil {
			http.Error(w, "Failed to approve user", http.StatusInternalServerError)
			return
		}
		
// Assign "Beginner" badge upon approval
	BadgeCollection := h.DB.Collection("badges")
	_, err = BadgeCollection.InsertOne(context.Background(), models.Badge{
		UserID:      pendingUser.ID,
		Name:        "Beginner",
		Description: "joined the community!",
		Type:        "class-tag",
		CreatedAt:   time.Now(),
	})

	
if err != nil {
			http.Error(w, "Failed to assign badge", http.StatusInternalServerError)
			return
		}
	// Delete the pending registration after approval
	_, err = pending.DeleteOne(context.Background(), bson.M{"email": input.Email})
	if err != nil {
		http.Error(w, "Failed to clean up pending registration", http.StatusInternalServerError)
		return
	}

	// Send success response to client
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User approved"})
}

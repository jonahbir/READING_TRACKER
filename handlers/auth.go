

package handlers

import (
    "context"
    "encoding/json"
    "net/http"
    "os"
    "time"

    "reading-tracker/backend/models" // Use hyphen
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "golang.org/x/crypto/bcrypt"
    "github.com/golang-jwt/jwt/v5"
)

// ... (rest of auth.go as provided)

type AuthHandler struct {
    DB *mongo.Database
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
    var input struct {
        Email             string `json:"email"`
        Password          string `json:"password"`
        Name              string `json:"name"`
        StudentID         string `json:"student_id"`
        InsaBatch         string `json:"insa_batch"`
        DormNumber        string `json:"dorm_number"`
        EducationalStatus string `json:"educational_status"`
    }
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    users := h.DB.Collection("users")
    pending := h.DB.Collection("pending_registrations")
    if count, _ := users.CountDocuments(context.Background(), bson.M{"email": input.Email}); count > 0 {
        http.Error(w, "Email already registered", http.StatusConflict)
        return
    }
    if count, _ := pending.CountDocuments(context.Background(), bson.M{"email": input.Email}); count > 0 {
        http.Error(w, "Email pending approval", http.StatusConflict)
        return
    }

    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
    if err != nil {
        http.Error(w, "Failed to process password", http.StatusInternalServerError)
        return
    }

    _, err = pending.InsertOne(context.Background(), models.PendingRegistration{
        Email:             input.Email,
        Password:          string(hashedPassword), // Add hashed password
        Name:              input.Name,
        StudentID:         input.StudentID,
        InsaBatch:         input.InsaBatch,
        DormNumber:        input.DormNumber,
        EducationalStatus: input.EducationalStatus,
        SubmittedAt:       time.Now(),
    })
    if err != nil {
        http.Error(w, "Failed to register", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{"message": "Registration pending admin approval"})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
    var input struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    users := h.DB.Collection("users")
    var user models.User
    err := users.FindOne(context.Background(), bson.M{"email": input.Email}).Decode(&user)
    if err != nil {
        http.Error(w, "Invalid email or password", http.StatusUnauthorized)
        return
    }

    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
        http.Error(w, "Invalid email or password", http.StatusUnauthorized)
        return
    }

    if !user.Verified {
        http.Error(w, "Account not verified", http.StatusForbidden)
        return
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id": user.ID.Hex(),
        "role":    user.Role,
        "exp":     time.Now().Add(time.Hour * 24).Unix(),
    })
    tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
    if err != nil {
        http.Error(w, "Failed to generate token", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}

func (h *AuthHandler) ApproveUser(w http.ResponseWriter, r *http.Request) {
    tokenString := r.Header.Get("Authorization")
    if tokenString == "" {
        http.Error(w, "Missing token", http.StatusUnauthorized)
        return
    }
    if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
        tokenString = tokenString[7:]
    }

    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        return []byte(os.Getenv("JWT_SECRET")), nil
    })
    if err != nil || !token.Valid {
        http.Error(w, "Invalid token", http.StatusUnauthorized)
        return
    }
    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok || claims["role"] != "admin" {
        http.Error(w, "Admin access required", http.StatusForbidden)
        return
    }

    var input struct {
        Email string `json:"email"`
    }
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    pending := h.DB.Collection("pending_registrations")
    var pendingUser models.PendingRegistration
    err = pending.FindOne(context.Background(), bson.M{"email": input.Email}).Decode(&pendingUser)
    if err != nil {
        http.Error(w, "Pending user not found", http.StatusNotFound)
        return
    }

    users := h.DB.Collection("users")
    _, err = users.InsertOne(context.Background(), models.User{
        Email:             pendingUser.Email,
        Password:          pendingUser.Password,
        Name:              pendingUser.Name,
        Role:              "student",
        StudentID:         pendingUser.StudentID,
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

    _, err = pending.DeleteOne(context.Background(), bson.M{"email": input.Email})
    if err != nil {
        http.Error(w, "Failed to clean up pending registration", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "User approved"})
}
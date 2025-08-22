package handlers

import (
    "context"
    "encoding/json"
    "net/http"
    "os"
    "time"
	"github.com/jonahbi/reading-tracker/backend/models"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "golang.org/x/crypto/bcrypt"
    "github.com/golang-jwt/jwt/v5"
)

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

    // Check if email exists in users or pending_registrations
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

    // Insert into pending_registrations
    _, err := pending.InsertOne(context.Background(), models.PendingRegistration{
        Email:             input.Email,
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

    // Find user
    users := h.DB.Collection("users")
    var user models.User
    err := users.FindOne(context.Background(), bson.M{"email": input.Email}).Decode(&user)
    if err != nil {
        http.Error(w, "Invalid email or password", http.StatusUnauthorized)
        return
    }

    // Check password
    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
        http.Error(w, "Invalid email or password", http.StatusUnauthorized)
        return
    }

    // Check verification
    if !user.Verified {
        http.Error(w, "Account not verified", http.StatusForbidden)
        return
    }

    // Generate JWT
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
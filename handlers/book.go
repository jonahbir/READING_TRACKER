package handlers

import (
    "context"
    "encoding/json"
    "net/http"
    "os"
    "time"

    "reading-tracker/backend/models"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "github.com/golang-jwt/jwt/v5"
)

type BookHandler struct {
    DB *mongo.Database
}

func (h *BookHandler) BorrowBook(w http.ResponseWriter, r *http.Request) {
    // Verify JWT
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
    if !ok || claims["role"] != "student" {
        http.Error(w, "Student access required", http.StatusForbidden)
        return
    }

    // Get user_id from JWT
    userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
    if err != nil {
        http.Error(w, "Invalid user ID", http.StatusBadRequest)
        return
    }

    // Check user exists and is verified
    users := h.DB.Collection("users")
    var user models.User
    err = users.FindOne(context.Background(), bson.M{"_id": userID, "verified": true}).Decode(&user)
    if err != nil {
        http.Error(w, "User not found or not verified", http.StatusForbidden)
        return
    }

    // Parse request body
    var input struct {
        ISBN string `json:"isbn"`
    }
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    // Validate book exists and is available
    books := h.DB.Collection("books")
    var book models.Book
    err = books.FindOne(context.Background(), bson.M{"isbn": input.ISBN, "available": true}).Decode(&book)
    if err != nil {
        http.Error(w, "Book not found or not available", http.StatusNotFound)
        return
    }

    // Create BorrowHistory record
    borrowHistory := h.DB.Collection("BorrowHistory")
    _, err = borrowHistory.InsertOne(context.Background(), models.BorrowHistory{
        UserID:     userID,
        BookID:     book.ID,
        BorrowDate: time.Now(),
        Type:       book.Type,
    })
    if err != nil {
        http.Error(w, "Failed to create borrow record", http.StatusInternalServerError)
        return
    }

    // Update book availability
    _, err = books.UpdateOne(context.Background(), bson.M{"_id": book.ID}, bson.M{
        "$set": bson.M{
            "available":   false,
            "borrowed_by": userID,
        },
    })
    if err != nil {
        http.Error(w, "Failed to update book status", http.StatusInternalServerError)
        return
    }

    // Prepare response based on book type
    response := map[string]string{"message": "Book borrowed successfully"}
    if book.Type == "hardcopy" {
        response["location"] = book.PhysicalLocation
    } else {
        response["url"] = book.SoftcopyURL
    }

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(response)
}

func (h *BookHandler) ReturnBook(w http.ResponseWriter, r *http.Request) {
    // Verify JWT
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
    if !ok || claims["role"] != "student" {
        http.Error(w, "Student access required", http.StatusForbidden)
        return
    }

    // Get user_id from JWT
    userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
    if err != nil {
        http.Error(w, "Invalid user ID", http.StatusBadRequest)
        return
    }

    // Check user exists
    users := h.DB.Collection("users")
    var user models.User
    err = users.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
    if err != nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    // Parse request body
    var input struct {
        ISBN string `json:"isbn"`
    }
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    // Find book
    books := h.DB.Collection("books")
    var book models.Book
    err = books.FindOne(context.Background(), bson.M{"isbn": input.ISBN, "borrowed_by": userID}).Decode(&book)
    if err != nil {
        http.Error(w, "Book not found or not borrowed by you", http.StatusNotFound)
        return
    }

    // Find BorrowHistory record
    borrowHistory := h.DB.Collection("BorrowHistory")
    var record models.BorrowHistory
    err = borrowHistory.FindOne(context.Background(), bson.M{
        "user_id": userID,
        "book_id": book.ID,
        "return_date": bson.M{"$exists": false},
    }).Decode(&record)
    if err != nil {
        http.Error(w, "Borrow record not found", http.StatusNotFound)
        return
    }

    // Update BorrowHistory
    _, err = borrowHistory.UpdateOne(context.Background(), bson.M{"_id": record.ID}, bson.M{
        "$set": bson.M{"return_date": time.Now()},
    })
    if err != nil {
        http.Error(w, "Failed to update borrow record", http.StatusInternalServerError)
        return
    }

    // Update book availability
    _, err = books.UpdateOne(context.Background(), bson.M{"_id": book.ID}, bson.M{
        "$set": bson.M{
            "available":   true,
            "borrowed_by": nil,
        },
    })
    if err != nil {
        http.Error(w, "Failed to update book status", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Book returned successfully"})
}
package handlers
// This file belongs to the "handlers" package. A package groups related files together.

// We import all the tools (packages) we need for this file.
import (
    // "context" lets us carry deadlines, cancellation signals, and other request-scoped values.
    "context"
    // "encoding/json" helps us convert data to/from JSON (the format used in HTTP APIs).
    "encoding/json"
    // "net/http" provides everything to build HTTP servers and handle requests/responses.
    "net/http"
    // "os" lets us read environment variables like secrets and config.
    "os"
    // "time" gives us functions for current time, timestamps, etc.
    "time"

    // This imports our own data types (structs) like User, Book, etc.
    "reading-tracker/backend/models"
    // "bson" is MongoDB's query/response format (similar to JSON).
    "go.mongodb.org/mongo-driver/bson"
    // "primitive" gives us MongoDB's ObjectID type (a unique ID for documents).
    "go.mongodb.org/mongo-driver/bson/primitive"
    // "mongo" is the official MongoDB driver for Go (to talk to the database).
    "go.mongodb.org/mongo-driver/mongo"
    // "jwt" is used to parse and validate JSON Web Tokens (for auth).
    "github.com/golang-jwt/jwt/v5"
)

// BookHandler is a small struct that holds a reference to our MongoDB database.
// We attach methods to this struct so each handler can talk to the DB.
type BookHandler struct {
    DB *mongo.Database
}

// AddBook handles the "add a new book" request.
// It requires that the requester is an ADMIN and provides a valid JWT token.
func (h *BookHandler) AddBook(w http.ResponseWriter, r *http.Request) {
    // -------------------- AUTH: Verify JWT --------------------
    // Read the "Authorization" header sent by the client (should contain "Bearer <token>").
    tokenString := r.Header.Get("Authorization")
    // If no token is provided, we immediately reject with 401 Unauthorized.
    if tokenString == "" {
        http.Error(w, "Missing token", http.StatusUnauthorized)
        return
    }
    // If the value starts with "Bearer ", remove that prefix to get the raw token string.
    if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
        tokenString = tokenString[7:]
    }

    // Parse and validate the JWT using our secret key from the environment variable JWT_SECRET.
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        return []byte(os.Getenv("JWT_SECRET")), nil
    })
    // If parsing failed or token is invalid/expired, reject with 401.
    if err != nil || !token.Valid {
        http.Error(w, "Invalid token", http.StatusUnauthorized)
        return
    }
    // Extract the "claims" (extra data inside the token like user_id and role).
    claims, ok := token.Claims.(jwt.MapClaims)
    // Only allow users with role = "admin" to add books.
    if !ok || claims["role"] != "admin" {
        http.Error(w, "Admin access required", http.StatusForbidden)
        return
    }

    // -------------------- Identify the Admin --------------------
    // Convert the "user_id" from the token (a hex string) into a MongoDB ObjectID.
    adminID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
    // If conversion fails, the token has a bad/invalid user_id.
    if err != nil {
        http.Error(w, "Invalid admin ID", http.StatusBadRequest)
        return
    }

    // -------------------- Ensure Admin Exists --------------------
    // Access the "users" collection to find the admin user.
    users := h.DB.Collection("users")
    // We'll decode the found document into this "admin" variable.
    var admin models.User
    // Look for a user with _id = adminID and role = "admin".
    err = users.FindOne(context.Background(), bson.M{"_id": adminID, "role": "admin"}).Decode(&admin)
    // If not found, reject the request (no such admin).
    if err != nil {
        http.Error(w, "Admin not found", http.StatusForbidden)
        return
    }

    // -------------------- Read and Validate the Request Body --------------------
    // Define a temporary struct to hold the incoming book data from JSON.
    var input struct {
        Title           string `json:"title"`             // Book title
        Author          string `json:"author"`            // Book author
        ISBN            string `json:"isbn"`              // Unique code for the book
        Type            string `json:"type"`              // "hardcopy" or "softcopy"
        PhysicalLocation string `json:"physical_location"`// Where the hardcopy is stored (shelf/room)
        SoftcopyURL     string `json:"softcopy_url"`      // Link to the digital copy (if softcopy)
    }
    // Decode the JSON body from the request into "input".
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        // If the JSON is malformed or missing, return 400 Bad Request.
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    // Basic field checks: title, author, ISBN must be present.
    // Type must be either "hardcopy" or "softcopy".
    if input.Title == "" || input.Author == "" || input.ISBN == "" || (input.Type != "hardcopy" && input.Type != "softcopy") {
        http.Error(w, "Missing or invalid fields", http.StatusBadRequest)
        return
    }
    // If it's a hardcopy, we must know where it physically lives.
    if input.Type == "hardcopy" && input.PhysicalLocation == "" {
        http.Error(w, "Physical location required for hardcopy", http.StatusBadRequest)
        return
    }
    // If it's a softcopy, we must have a URL to the file.
    if input.Type == "softcopy" && input.SoftcopyURL == "" {
        http.Error(w, "Softcopy URL required for softcopy", http.StatusBadRequest)
        return
    }

    // -------------------- Check ISBN Uniqueness --------------------
    // Access the "books" collection.
    books := h.DB.Collection("books")
    // Count how many books already exist with the same ISBN.
    count, err := books.CountDocuments(context.Background(), bson.M{"isbn": input.ISBN})
    // If the check fails (DB error), return 500 Internal Server Error.
    if err != nil {
        http.Error(w, "Failed to check ISBN", http.StatusInternalServerError)
        return
    }
    // If at least one book with the same ISBN exists, reject with 409 Conflict.
    if count > 0 {
        http.Error(w, "ISBN already exists", http.StatusConflict)
        return
    }

    // -------------------- Insert the New Book --------------------
    // Create a models.Book using the input and some defaults.
    _, err = books.InsertOne(context.Background(), models.Book{
        Title:           input.Title,           // from request
        Author:          input.Author,          // from request
        ISBN:            input.ISBN,            // from request
        Type:            input.Type,            // "hardcopy" or "softcopy"
        PhysicalLocation: input.PhysicalLocation, // required if hardcopy
        SoftcopyURL:     input.SoftcopyURL,     // required if softcopy
        Available:       true,                  // new books start as available
        AddedBy:         adminID,               // who added the book
        CreatedAt:       time.Now(),            // timestamp of creation
    })
    // If inserting into DB fails, return 500 Internal Server Error.
    if err != nil {
        http.Error(w, "Failed to add book", http.StatusInternalServerError)
        return
    }

    // -------------------- Respond to Client --------------------
    // 201 Created indicates a new resource (book) was created successfully.
    w.WriteHeader(http.StatusCreated)
    // Send a small JSON message back to the client.
    json.NewEncoder(w).Encode(map[string]string{"message": "Book added successfully"})
}

// ListBooks returns all books that are currently available to borrow.
// It requires a valid JWT from a verified STUDENT.
func (h *BookHandler) ListBooks(w http.ResponseWriter, r *http.Request) {
    // -------------------- AUTH: Verify JWT --------------------
    // Read the Authorization header (should contain "Bearer <token>").
    tokenString := r.Header.Get("Authorization")
    // If no token is provided, reject with 401 Unauthorized.
    if tokenString == "" {
        http.Error(w, "Missing token", http.StatusUnauthorized)
        return
    }
    // Strip the "Bearer " prefix if present.
    if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
        tokenString = tokenString[7:]
    }

    // Parse and validate the JWT with our secret key.
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        return []byte(os.Getenv("JWT_SECRET")), nil
    })
    // If invalid or expired, reject.
    if err != nil || !token.Valid {
        http.Error(w, "Invalid token", http.StatusUnauthorized)
        return
    }
    // Extract claims and ensure the user role is "student".
    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok || claims["role"] != "student" {
        http.Error(w, "Student access required", http.StatusForbidden)
        return
    }

    // -------------------- Identify the Student --------------------
    // Convert the "user_id" claim (hex) to a MongoDB ObjectID.
    userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
    // If it's not a valid ObjectID, reject the request.
    if err != nil {
        http.Error(w, "Invalid user ID", http.StatusBadRequest)
        return
    }

    // -------------------- Ensure the Student Exists & Is Verified --------------------
    // Access the "users" collection.
    users := h.DB.Collection("users")
    // Prepare a variable to store the found user.
    var user models.User
    // Find a document where _id matches and "verified" is true.
    err = users.FindOne(context.Background(), bson.M{"_id": userID, "verified": true}).Decode(&user)
    // If not found, the user is either missing or not verified yet.
    if err != nil {
        http.Error(w, "User not found or not verified", http.StatusForbidden)
        return
    }

    // -------------------- Fetch Available Books --------------------
    // Access the "books" collection.
    books := h.DB.Collection("books")
    // Find all documents where "available" is true (i.e., not borrowed).
    cursor, err := books.Find(context.Background(), bson.M{"available": true})
    // If the query fails, return 500.
    if err != nil {
        http.Error(w, "Failed to fetch books", http.StatusInternalServerError)
        return
    }
    // Always close the cursor when we're done to free resources.
    defer cursor.Close(context.Background())

    // We'll decode all found books into this slice.
    var availableBooks []models.Book
    // cursor.All reads everything into the slice in one go.
    if err := cursor.All(context.Background(), &availableBooks); err != nil {
        http.Error(w, "Failed to decode books", http.StatusInternalServerError)
        return
    }

    // -------------------- Respond to Client --------------------
    // 200 OK: we successfully found and prepared the list.
    w.WriteHeader(http.StatusOK)
    // Send the list of available books as JSON.
    json.NewEncoder(w).Encode(availableBooks)
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

    // Get student ID from JWT
    studentID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
    if err != nil {
        http.Error(w, "Invalid student ID", http.StatusBadRequest)
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

    // Check if book exists and is available
    books := h.DB.Collection("books")
    var book models.Book
    err = books.FindOne(context.Background(), bson.M{"isbn": input.ISBN, "available": true}).Decode(&book)
    if err != nil {
        http.Error(w, "Book not available", http.StatusNotFound)
        return
    }

    // Mark book as borrowed (available = false)
    _, err = books.UpdateOne(
        context.Background(),
        bson.M{"isbn": input.ISBN},
        bson.M{"$set": bson.M{"available": false}},
    )
    if err != nil {
        http.Error(w, "Failed to borrow book", http.StatusInternalServerError)
        return
    }

    // Record borrowing history
    borrows := h.DB.Collection("borrows")
    _, err = borrows.InsertOne(context.Background(), bson.M{
        "student_id": studentID,
        "book_id":    book.ID,
        "borrowed_at": time.Now(),
        "returned":   false,
    })
    if err != nil {
        http.Error(w, "Failed to record borrow", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Book borrowed successfully"})
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

func (h *BookHandler) UpdateReadingProgress(w http.ResponseWriter, r *http.Request) {
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
        ISBN       string `json:"isbn"`
        PagesRead  int    `json:"pages_read"`
        TotalPages int    `json:"total_pages"`
        Reflection string `json:"reflection"`
    }
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    // Validate input
    if input.ISBN == "" || input.PagesRead < 0 || input.TotalPages <= 0 || input.PagesRead > input.TotalPages {
        http.Error(w, "Invalid input fields", http.StatusBadRequest)
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
    var borrowRecord models.BorrowHistory
    err = borrowHistory.FindOne(context.Background(), bson.M{
        "user_id": userID,
        "book_id": book.ID,
        "return_date": bson.M{"$exists": false},
    }).Decode(&borrowRecord)
    if err != nil {
        http.Error(w, "Borrow record not found", http.StatusNotFound)
        return
    }

    // Check existing progress
    readingProgress := h.DB.Collection("ReadingProgress")
    var progress models.ReadingProgress
    err = readingProgress.FindOne(context.Background(), bson.M{
        "user_id": userID,
        "book_id": book.ID,
        "borrow_history_id": borrowRecord.ID,
    }).Decode(&progress)

    // Calculate streak (simple: increment if updated today or yesterday)
    streakDays := 1
    if err == nil {
        lastUpdated := progress.LastUpdated
        today := time.Now().Truncate(24 * time.Hour)
        yesterday := today.Add(-24 * time.Hour)
        if lastUpdated.Truncate(24 * time.Hour).Equal(yesterday) {
            streakDays = progress.StreakDays + 1
        } else if !lastUpdated.Truncate(24 * time.Hour).Equal(today) {
            streakDays = 1
        }
    }

    // Update or create progress
    update := bson.M{
        "$set": bson.M{
            "pages_read":       input.PagesRead,
            "total_pages":      input.TotalPages,
            "reflection":       input.Reflection,
            "streak_days":      streakDays,
            "last_updated":     time.Now(),
            "completed":        false, // Only set to true after review approval
        },
    }
    if err == nil {
        // Update existing
        _, err = readingProgress.UpdateOne(context.Background(), bson.M{
            "_id": progress.ID,
        }, update)
        if err != nil {
            http.Error(w, "Failed to update progress", http.StatusInternalServerError)
            return
        }
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{"message": "Progress updated"})
    } else {
        // Create new
        _, err = readingProgress.InsertOne(context.Background(), models.ReadingProgress{
            UserID:          userID,
            BookID:          book.ID,
            PagesRead:       input.PagesRead,
            TotalPages:      input.TotalPages,
            Reflection:      input.Reflection,
            StreakDays:      streakDays,
            BorrowHistoryID: borrowRecord.ID,
            Completed:       false,
            LastUpdated:     time.Now(),
        })
        if err != nil {
            http.Error(w, "Failed to create progress", http.StatusInternalServerError)
            return
        }
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(map[string]string{"message": "Progress created"})
    }
}

func (h *BookHandler) SubmitReview(w http.ResponseWriter, r *http.Request) {
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
    err = users.FindOne(context.Background(), bson.M{"_id": userID, "verified": true}).Decode(&user)
    if err != nil {
        http.Error(w, "User not found or not verified", http.StatusForbidden)
        return
    }

    // Parse request body
    var input struct {
        ISBN       string `json:"isbn"`
        ReviewText string `json:"review_text"`
    }
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    // Validate input
    if input.ISBN == "" || input.ReviewText == "" {
        http.Error(w, "Missing ISBN or review text", http.StatusBadRequest)
        return
    }

    // Find book
    books := h.DB.Collection("books")
    var book models.Book
    err = books.FindOne(context.Background(), bson.M{"isbn": input.ISBN}).Decode(&book)
    if err != nil {
        http.Error(w, "Book not found", http.StatusNotFound)
        return
    }

    // Check if book is borrowed
    borrowHistory := h.DB.Collection("BorrowHistory")
    var borrowRecord models.BorrowHistory
    err = borrowHistory.FindOne(context.Background(), bson.M{
        "user_id": userID,
        "book_id": book.ID,
        "return_date": bson.M{"$exists": false},
    }).Decode(&borrowRecord)
    if err != nil {
        http.Error(w, "Book not borrowed by you", http.StatusForbidden)
        return
    }

    // Check if review already exists
    reviews := h.DB.Collection("Reviews")
    count, err := reviews.CountDocuments(context.Background(), bson.M{
        "user_id": userID,
        "book_id": book.ID,
        "borrow_history_id": borrowRecord.ID,
    })
    if err != nil {
        http.Error(w, "Failed to check reviews", http.StatusInternalServerError)
        return
    }
    if count > 0 {
        http.Error(w, "Review already submitted for this book", http.StatusConflict)
        return
    }

    // Create review
    _, err = reviews.InsertOne(context.Background(), models.Review{
        BookID:        book.ID,
        UserID:        userID,
        ReviewText:    input.ReviewText,
        AICheckStatus: "pending",
        AIScore:       0,
        Posted:        false,
        Upvotes:       0,
        CreatedAt:     time.Now(),
    })
    if err != nil {
        http.Error(w, "Failed to submit review", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{"message": "Review submitted"})
}

func (h *BookHandler) ApproveReview(w http.ResponseWriter, r *http.Request) {
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
    if !ok || claims["role"] != "admin" {
        http.Error(w, "Admin access required", http.StatusForbidden)
        return
    }

    // Get admin_id from JWT
    adminID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
    if err != nil {
        http.Error(w, "Invalid admin ID", http.StatusBadRequest)
        return
    }

    // Check admin exists
    users := h.DB.Collection("users")
    var admin models.User
    err = users.FindOne(context.Background(), bson.M{"_id": adminID, "role": "admin"}).Decode(&admin)
    if err != nil {
        http.Error(w, "Admin not found", http.StatusForbidden)
        return
    }

    // Parse request body
    var input struct {
        ReviewID string `json:"review_id"`
        Status   string `json:"status"` // "approved" or "rejected"
    }
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid input", http.StatusBadRequest)
        return
    }

    // Validate input
    if input.ReviewID == "" || (input.Status != "approved" && input.Status != "rejected") {
        http.Error(w, "Invalid review ID or status", http.StatusBadRequest)
        return
    }

    reviewID, err := primitive.ObjectIDFromHex(input.ReviewID)
    if err != nil {
        http.Error(w, "Invalid review ID format", http.StatusBadRequest)
        return
    }

    // Find review
    reviews := h.DB.Collection("Reviews")
    var review models.Review
    err = reviews.FindOne(context.Background(), bson.M{
        "_id": reviewID,
        "ai_check_status": "pending",
    }).Decode(&review)
    if err != nil {
        http.Error(w, "Review not found or not pending", http.StatusNotFound)
        return
    }

    // Update review
    update := bson.M{
        "$set": bson.M{
            "ai_check_status": input.Status,
            "posted":          input.Status == "approved",
        },
    }
    _, err = reviews.UpdateOne(context.Background(), bson.M{"_id": reviewID}, update)
    if err != nil {
        http.Error(w, "Failed to update review", http.StatusInternalServerError)
        return
    }

    // If approved, update user stats and mark progress as completed
    if input.Status == "approved" {
        _, err = users.UpdateOne(context.Background(), bson.M{"_id": review.UserID}, bson.M{
            "$inc": bson.M{
                "books_read":  1,
                "rank_score": 10,
            },
        })
        if err != nil {
            http.Error(w, "Failed to update user stats", http.StatusInternalServerError)
            return
        }

        // Mark ReadingProgress as completed
        _, err = h.DB.Collection("ReadingProgress").UpdateOne(context.Background(), bson.M{
            "user_id": review.UserID,
            "book_id": review.BookID,
        }, bson.M{
            "$set": bson.M{"completed": true},
        })
        if err != nil {
            http.Error(w, "Failed to update reading progress", http.StatusInternalServerError)
            return
        }
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Review " + input.Status})
}
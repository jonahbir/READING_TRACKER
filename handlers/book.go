package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"reading-tracker/backend/models"

	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type BookHandler struct {
	DB *mongo.Database
}

// this function will enable the admin to add new book to the available books- working correctly
func (h *BookHandler) AddBook(w http.ResponseWriter, r *http.Request) {

	tokenString := r.Header.Get("Authorization")

	if tokenString == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}

	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
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

	adminID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))

	if err != nil {
		http.Error(w, "Invalid admin ID", http.StatusBadRequest)
		return
	}

	users := h.DB.Collection("users")

	var admin models.User

	err = users.FindOne(context.Background(), bson.M{"_id": adminID, "role": "admin"}).Decode(&admin)

	if err != nil {
		http.Error(w, "Admin not found", http.StatusForbidden)
		return
	}

	var input struct {
		Title            string `json:"title"`
		Author           string `json:"author"`
		ISBN             string `json:"isbn"`
		Type             string `json:"type"`
		PhysicalLocation string `json:"physical_location"`
		PhoneNumberOfTheHandler string `json:"phone_number_of_the_handler"`
		SoftcopyURL      string `json:"softcopy_url"`
		AboutTheBook     string `json:"about_the_book"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {

		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if input.Title == "" || input.Author == "" || input.ISBN == "" || (input.Type != "hardcopy" && input.Type != "softcopy") {
		http.Error(w, "Missing important fields", http.StatusBadRequest)
		return
	}

	if input.Type == "hardcopy" && input.PhysicalLocation == "" {
		http.Error(w, "Physical location required for hardcopy", http.StatusBadRequest)
		return
	}

	if input.Type == "softcopy" && input.SoftcopyURL == "" {
		http.Error(w, "Softcopy URL required for softcopy", http.StatusBadRequest)
		return
	}

	books := h.DB.Collection("books")

	count, err := books.CountDocuments(context.Background(), bson.M{"isbn": input.ISBN})

	if err != nil {
		http.Error(w, "Failed to check ISBN", http.StatusInternalServerError)
		return
	}

	if count > 0 {
		http.Error(w, "ISBN already exists", http.StatusConflict)
		return
	}

	_, err = books.InsertOne(context.Background(), models.Book{
		Title:            input.Title,
		Author:           input.Author,
		ISBN:             input.ISBN,
		Type:             input.Type,
		PhysicalLocation: input.PhysicalLocation,
		PhoneNumberOfTheHandler: input.PhoneNumberOfTheHandler,
		SoftcopyURL:      input.SoftcopyURL,
		Available:        true,
		AddedBy:          adminID,
		CreatedAt:        time.Now(),
		AboutTheBook:     input.AboutTheBook,
	})

	if err != nil {
		http.Error(w, "Failed to add book", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]string{"message": "Book added successfully"})
}

// this function will show all books available to the main page- working correctly

func (h *BookHandler) ListAllBooks(w http.ResponseWriter, r *http.Request) {
	books := h.DB.Collection("books")

	var BooksStruct []models.Book

	Curser, err := books.Find(context.Background(), bson.M{})
	if err != nil {
		http.Error(w, "the server cannot load the book", http.StatusInternalServerError)
	}
	defer Curser.Close(context.Background())

	if err := Curser.All(context.Background(), &BooksStruct); err != nil {
		http.Error(w, "error while loading the book", http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(BooksStruct)
}

// this will show all books available for reading just to the user-- working 

func (h *BookHandler) ListavailableBooks(w http.ResponseWriter, r *http.Request) {

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

	userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))

	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	users := h.DB.Collection("users")

	var user models.User

	err = users.FindOne(context.Background(), bson.M{"_id": userID, "verified": true}).Decode(&user)

	if err != nil {
		http.Error(w, "User not found or not verified", http.StatusForbidden)
		return
	}

	books := h.DB.Collection("books")

	cursor, err := books.Find(context.Background(), bson.M{"available": true})

	if err != nil {
		http.Error(w, "Failed to fetch books", http.StatusInternalServerError)
		return
	}

	defer cursor.Close(context.Background())

	var availableBooks []models.Book

	if err := cursor.All(context.Background(), &availableBooks); err != nil {
		http.Error(w, "Failed to decode books", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(availableBooks)
}

// this will enable the user to borrow a book from the library! a hard copy!--- working
func (h *BookHandler) BorrowBook(w http.ResponseWriter, r *http.Request) {

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

	// Check if book exists and is available and is hardcopy
	books := h.DB.Collection("books")
	
	var book models.Book

	err = books.FindOne(context.Background(), bson.M{"isbn": input.ISBN, "available": true,"type":"hardcopy"}).Decode(&book)
	if err != nil {
		http.Error(w, "no such hardcopy book available", http.StatusNotFound)
		return
	}

	
		_, err = books.UpdateOne(
			context.Background(),
			bson.M{"isbn": input.ISBN},
			bson.M{"$set": bson.M{"available": false, "borrowed_by": studentID}},
		)

		if err != nil {
			http.Error(w, "Failed to borrow book", http.StatusInternalServerError)
			return
		}

	
	// Record borrowing history
	borrows := h.DB.Collection("BorrowHistory")
	_, err = borrows.InsertOne(context.Background(), bson.M{
		"isbn":        book.ISBN,
		"title":       book.Title,
		"user_id":     studentID,
		"book_id":     book.ID,
		"borrow_date": time.Now(),
	})
	if err != nil {
		http.Error(w, "Failed to record borrow", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"location": book.PhysicalLocation, "phone_number":book.PhoneNumberOfTheHandler})
}



// the admin will apporve if the book is returned or not!
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

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["role"] != "admin" {
		http.Error(w, "admin access required", http.StatusForbidden)
		return
	}

	// Get user_id from JWT
	userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Check user exists
	users := h.DB.Collection("users")
	var admin models.User
	err = users.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&admin)
	if err != nil || admin.Role!="admin"{
		http.Error(w, "admin not found", http.StatusNotFound)
		return
	}


	// Parse request body
	var input struct {
		ISBN string `json:"isbn"`
		User_Id string `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Find book
	books := h.DB.Collection("books")
	var book models.Book
	err = books.FindOne(context.Background(), bson.M{"isbn": input.ISBN}).Decode(&book)  // here you should add another criteria to check id the book is really borrowed by the user later after adding user_id to your database
	if err != nil {
		http.Error(w, "Book not found or book not borrowed by this user", http.StatusNotFound)
		return
	}

	
	// Find BorrowHistory record
	borrowHistory := h.DB.Collection("BorrowHistory")
	var record models.BorrowHistory
	err = borrowHistory.FindOne(context.Background(), bson.M{
		"user_id":     book.BorrowedBy,
		"book_id":     book.ID,
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


// we must have another db collection that records books which are currently  being read! so when i user takes a hardcopy book, 
// we will immediatly ad the book under the reading record by the user! 
// then he also can add a soft copy book into the collection and mark them as being read!








// this will hep the user to update the reading progress! but check it read everything
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
	err = books.FindOne(context.Background(), bson.M{"isbn": input.ISBN, "borrowed_by": userID}).Decode(&book)  // here it can be soft copy so borrowed_by is not valid rather check it from the db reading
	if err != nil {
		http.Error(w, "Book not found or not borrowed by you", http.StatusNotFound)
		return
	}

	// Find BorrowHistory record
	borrowHistory := h.DB.Collection("BorrowHistory")
	var borrowRecord models.BorrowHistory
	err = borrowHistory.FindOne(context.Background(), bson.M{
		"user_id":     userID,
		"book_id":     book.ID,
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
		"user_id":           userID,
		"book_id":           book.ID,
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
			"pages_read":   input.PagesRead,
			"total_pages":  input.TotalPages,
			"reflection":   input.Reflection,
			"streak_days":  streakDays,
			"last_updated": time.Now(),
			"completed":    false, // Only set to true after review approval
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





// this is to update the submit review
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
		"user_id":     userID,
		"book_id":     book.ID,
		"return_date": bson.M{"$exists": false},
	}).Decode(&borrowRecord)
	if err != nil {
		http.Error(w, "Book not borrowed by you", http.StatusForbidden)
		return
	}

	// Check if review already exists
	reviews := h.DB.Collection("Reviews")
	count, err := reviews.CountDocuments(context.Background(), bson.M{
		"user_id":           userID,
		"book_id":           book.ID,
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

// this will approv the book review by the admin

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
		"_id":             reviewID,
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
				"books_read": 1,
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

package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"reading-tracker/backend/helpers"
	"reading-tracker/backend/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
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
		Title                   string `json:"title"`
		Author                  string `json:"author"`
		ISBN                    string `json:"isbn"`
		Genre				   string `json:"genre"`
		Type                    string `json:"type"`
		PhysicalLocation        string `json:"physical_location"`
		PhoneNumberOfTheHandler string `json:"phone_number_of_the_handler"`
		SoftcopyURL             string `json:"softcopy_url"`
		AboutTheBook            string `json:"about_the_book"`
		TotalPages              int    `json:"total_pages"`
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
		Title:                   input.Title,
		Author:                  input.Author,
		ISBN:                    input.ISBN,
		Genre: 				     input.Genre,
		Type:                    input.Type,
		PhysicalLocation:        input.PhysicalLocation,
		PhoneNumberOfTheHandler: input.PhoneNumberOfTheHandler,
		SoftcopyURL:             input.SoftcopyURL,
		Available:               true,
		AddedBy:                 adminID,
		CreatedAt:               time.Now(),
		AboutTheBook:            input.AboutTheBook,
		TotalPages:              input.TotalPages,
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
	users := h.DB.Collection("users")

	var book models.Book
	var user models.User
	err = books.FindOne(context.Background(), bson.M{"isbn": input.ISBN, "available": true, "type": "hardcopy"}).Decode(&book)
	if err != nil {
		http.Error(w, "book not available or not hardcopy", http.StatusNotFound)
		return
	}

	err = users.FindOne(context.Background(), bson.M{"_id": studentID}).Decode(&user)
	if err != nil {
		http.Error(w, "error while trying to parse user", http.StatusInternalServerError)

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
		"reader_id":   user.ReaderID,
		"book_id":     book.ID,
		"borrow_date": time.Now(),
		"type":        book.Type,
	})
	if err != nil {
		http.Error(w, "Failed to record borrow", http.StatusInternalServerError)
		return
	}

	// record reading

	reading := h.DB.Collection("reading")
	_, err = reading.InsertOne(context.Background(), bson.M{
		"book_id":          book.ID,
		"user_id":          studentID,
		"reader_id":        user.ReaderID,
		"isbn":             book.ISBN,
		"started_at":       time.Now(),
		"added_to_reading": false,
	})
	if err != nil {
		http.Error(w, "failed to record reading", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"location": book.PhysicalLocation, "phone_number": book.PhoneNumberOfTheHandler})
}

// this hanlder will add softcopy books to the reading list

func (h *BookHandler) AddToReading(w http.ResponseWriter, r *http.Request) {

	// only the user can add a book to this collection so we need to verify that the man who logged in is student-
	// after varifying that he is student then we have to have a struct where we save the input we recieve
	// then we need to decode the json we accepted as input
	// then we need to verify that the book is available for reading- we will check that in the books collection
	// then we will add the book to the collection
	// then we will send a success message

	tokenstring := r.Header.Get("Authorization")

	if tokenstring == "" {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}
	if len(tokenstring) > 7 && tokenstring[:7] == "Bearer " {
		tokenstring = tokenstring[7:]

	}
	token, err := jwt.Parse(tokenstring, func(token *jwt.Token) (any, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil

	})

	if err != nil || !token.Valid {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}
	Claims, ok := token.Claims.(jwt.MapClaims)

	if !ok || Claims["role"] != "student" {
		http.Error(w, "student access needed", http.StatusUnauthorized)
		return
	}

	userid, err := primitive.ObjectIDFromHex(Claims["user_id"].(string))

	if err != nil {
		http.Error(w, "Error while parsing the id", http.StatusInternalServerError)
		return
	}

	users := h.DB.Collection("users")
	var user models.User

	err = users.FindOne(context.Background(), bson.M{"_id": userid}).Decode(&user)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	var input struct {
		ISBN string `json:"isbn"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "error while recieveing input", http.StatusBadRequest)
		return
	}
	books := h.DB.Collection("books")

	var book models.Book
	if err := books.FindOne(context.Background(), bson.M{"isbn": input.ISBN}).Decode(&book); err != nil {
		http.Error(w, "no such book exists!", http.StatusNotFound)
		return
	}

	// now lastly we can insert the book into reading progress of the user

	// type Reading struct {
	// 	ID primitive.ObjectID `bson:"_id,omitempty"`
	// 	BookID primitive.ObjectID `bson:"book_id"`
	// 	UserID primitive.ObjectID  `bson:"user_id"`
	// 	ReaderID string            `bson:"reader_id"`

	// }

	reading := h.DB.Collection("reading")

	if count, _ := reading.CountDocuments(context.Background(), bson.M{"book_id": book.ID}); count > 0 {
		http.Error(w, "this book is already marked as reading !", http.StatusConflict)
		return

	}

	_, err = reading.InsertOne(context.Background(), bson.M{
		"book_id":          book.ID,
		"user_id":          userid,
		"isbn":             input.ISBN,
		"reader_id":        user.ReaderID,
		"started_at":       time.Now(),
		"added_to_reading": false,
	})
	if err != nil {
		http.Error(w, "failed to record", http.StatusInternalServerError)
		return
	}

	// now tell the user that he has added the book to the reading db
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(map[string]string{
		"message": "the book is marked as reading!",
	})
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
	if err != nil || admin.Role != "admin" {
		http.Error(w, "admin not found", http.StatusNotFound)
		return
	}

	// Parse request body
	var input struct {
		ISBN     string `json:"isbn"`
		ReaderID string `json:"reader_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
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

	// Find BorrowHistory record
	borrowHistory := h.DB.Collection("BorrowHistory")
	var record models.BorrowHistory
	err = borrowHistory.FindOne(context.Background(), bson.M{
		"user_id":     book.BorrowedBy,
		"reader_id":   input.ReaderID,
		"isbn":        input.ISBN,
		"book_id":     book.ID,
		"return_date": bson.M{"$exists": false},
	}).Decode(&record)
	if err != nil {
		http.Error(w, "Borrow record not found or not borrowed by this user", http.StatusNotFound)
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

// this will help the user to update the reading progress! but check it read everything
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
		Reflection string `json:"reflection"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Validate input
	if input.ISBN == "" || input.PagesRead < 0 {
		http.Error(w, "Invalid input fields", http.StatusBadRequest)
		return
	}

	// Find book
	reading := h.DB.Collection("reading")
	var book models.Reading

	err = reading.FindOne(context.Background(), bson.M{"isbn": input.ISBN, "user_id": userID}).Decode(&book)
	if err != nil {
		http.Error(w, "Book not found or you are not reading this book!", http.StatusNotFound)
		return
	}

	// Check existing progress
	readingProgress := h.DB.Collection("ReadingProgress")
	var progress models.ReadingProgress
	err = readingProgress.FindOne(context.Background(), bson.M{
		"user_id": userID,
		"book_id": book.ID,
	}).Decode(&progress)

	// Calculate streak (simple: increment if updated today or yesterday)
	streakDays := 1
	streakIncreased := false
	if err == nil {
		lastUpdated := progress.LastUpdated
		today := time.Now().Truncate(24 * time.Hour)
		yesterday := today.Add(-24 * time.Hour)
		if lastUpdated.Truncate(24 * time.Hour).Equal(yesterday) {
			streakDays = progress.StreakDays + 1
			streakIncreased = true
		} else if !lastUpdated.Truncate(24 * time.Hour).Equal(today) {
			streakDays = 1
			streakIncreased = true
		} else {
			streakDays = progress.StreakDays
		}
	}

	var book_original models.Book
	books := h.DB.Collection("books")

	if err := books.FindOne(context.Background(), bson.M{"isbn": input.ISBN}).Decode(&book_original); err != nil {
		http.Error(w, "error while fetching the book!", http.StatusInternalServerError)
		return
	}

	if book_original.TotalPages < input.PagesRead {
		http.Error(w, "no of pages you read cannot be greater than pages of the book!", http.StatusConflict)
		return
	}

	// Update or create progress
	update := bson.M{
		"$set": bson.M{
			"pages_read":   input.PagesRead,
			"reader_id":    user.ReaderID,
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

		// ✅ Award points if streak increased
		if streakIncreased {
		  helpers.UpdateRankScore(h.DB, userID, 1)
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Progress updated"})
	} else {
		// Create new
		_, err = readingProgress.InsertOne(context.Background(), models.ReadingProgress{
			UserID:         userID,
			BookID:         book_original.ID,
			PagesRead:      input.PagesRead,
			BookTitle:      book_original.Title,
			TotalPages:     book_original.TotalPages,
			Reflection:     input.Reflection,
			StreakDays:     streakDays,
			ISBN:           input.ISBN,
			StartedReading: book.StartedReading,
			Completed:      false,
			LastUpdated:    time.Now(),
		})

		if err != nil {
			http.Error(w, "Failed to create progress", http.StatusInternalServerError)
			return
		}

		_, err = reading.UpdateOne(context.Background(), bson.M{"isbn": input.ISBN, "user_id": userID}, bson.M{"$set": bson.M{"added_to_reading": true}})
		if err != nil {
			http.Error(w, "Error while updating reading", http.StatusInternalServerError)
			return
		}
        // just update the badge
		helpers.UpdateUserBadgesAndClassTag(userID,h.DB)
		// ✅ New progress starts with streak → award points
		helpers.UpdateRankScore(h.DB, userID, 1)

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

	// Check if book is in reading
	reading := h.DB.Collection("reading")
	var borrowRecord models.BorrowHistory
	err = reading.FindOne(context.Background(), bson.M{
		"user_id": userID,
		"book_id": book.ID,
	}).Decode(&borrowRecord)
	if err != nil {
		http.Error(w, "you were not reading this book", http.StatusForbidden)
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
		ReaderID:      user.ReaderID,
		ReviewText:    input.ReviewText,
		AICheckStatus: "pending",
		AIScore:       0,
		Posted:        false,
		BookDeleted:   false,
		Upvotes:       0,
		CreatedAt:     time.Now(),
		UpvotedBy: []primitive.ObjectID{},
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
		ReaderID string `json:"reader_id"`
		Status   string `json:"status"` // "approved" or "rejected"
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Validate input
	if input.ReaderID == "" {
		http.Error(w, "Invalid review ID or status1", http.StatusBadRequest)
		return
	}

	// Validate input
	if input.Status != "approved" && input.Status != "rejected" {
		http.Error(w, "Invalid review ID or status2", http.StatusBadRequest)
		return
	}
	// Find review
	reviews := h.DB.Collection("Reviews")
	var review models.Review
	err = reviews.FindOne(context.Background(), bson.M{
		"reader_id":       input.ReaderID,
		"book_deleted":    false,
		"ai_check_status": "pending",
	}).Decode(&review)
	if err != nil {
		http.Error(w, "Review not found or not pending", http.StatusNotFound)
		return
	}


	save := input.Status == "approved"
	_, err = reviews.UpdateOne(context.Background(), bson.M{"reader_id": input.ReaderID}, bson.M{
		"$set": bson.M{
			"ai_check_status": input.Status,
			"posted":          save,
		},
	})
	if err != nil {
		http.Error(w, "Failed to update review", http.StatusInternalServerError)
		return
	}

	// If approved, update user stats and mark progress as completed
	if input.Status == "approved" {
		_, err = users.UpdateOne(context.Background(), bson.M{"_id": review.UserID}, bson.M{
			"$inc": bson.M{
				"books_read": 1,
			},
		})
		if err != nil {
			http.Error(w, "Failed to update user stats", http.StatusInternalServerError)
			return
		}

		_, err := h.DB.Collection("ReadingProgress").UpdateOne(
			context.Background(),
			bson.M{"user_id": review.UserID, "book_id": review.BookID},
			bson.M{"$set": bson.M{"completed": true, "finished_reading": time.Now()}},
		)

		if err != nil {

			http.Error(w, "Failed to update reading progress", http.StatusInternalServerError)
			return
		}
		// update the badge 
		helpers.UpdateUserBadgesAndClassTag(review.UserID,h.DB)
	// ✅ Rank score for review approval
    helpers.UpdateRankScore(h.DB, review.UserID, 5)

	}
    // ✅ Always give rank score for finishing book (approved OR rejected)
helpers.UpdateRankScore(h.DB, review.UserID, 10)

	reading := h.DB.Collection("reading")

	_, err = reading.UpdateOne(context.Background(), bson.M{"book_id": review.BookID}, bson.M{
		"$set": bson.M{
			"finished_reading": time.Now(),
		}})

	if err != nil {
		http.Error(w, "couldn't find the book in reading", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Review " + input.Status})
}

// now we are going to build another end point user-reading-progress
// this end point will show the user it's own reading progress

func (h *BookHandler) ShowReadingProgress(w http.ResponseWriter, r *http.Request) {

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

	users := h.DB.Collection("users")
	var user models.User
	reading := h.DB.Collection("reading")
	readingprogress := h.DB.Collection("ReadingProgress")

	if err := users.FindOne(context.Background(), bson.M{"_id": studentID}).Decode(&user); err != nil {
		http.Error(w, "this user doesn't exist", http.StatusUnauthorized)
		return

	}

	var BooksReading []models.Reading

	Curser, err := reading.Find(context.Background(), bson.M{"user_id": studentID, "added_to_reading": false})

	if err != nil {
		http.Error(w, "this user is not reading any book!", http.StatusNotFound)
		return
	}

	defer Curser.Close(context.Background())

	if err := Curser.All(context.Background(), &BooksReading); err != nil {
		http.Error(w, "error while loading the book", http.StatusInternalServerError)
		return
	}

	var BooksInProgress []models.ReadingProgress
	Curser, _ = readingprogress.Find(context.Background(), bson.M{"user_id": studentID})

	defer Curser.Close(context.Background())
	_ = Curser.All(context.Background(), &BooksInProgress)

	// now we will create a new list and add all elements from the reading progress and the reading to this list
	// to do this, we will go through both lists and take these properties from the lists

	// what properties do we take ?
	// pages read -
	// total page -
	// reflation
	// completed status
	// startdate-
	// completed date if completed
	// title of the book
	// ISBN of the book
	//streakdays
	// lastupdated
	books := h.DB.Collection("books")
	var book models.Book

	type ans struct {
		Title           string    `json:"title"`
		Author          string    `json:"author"`
		ISBN            string    `json:"isbn"`
		TotalPage       int       `json:"total_page"`
		PagesRead       int       `json:"pages_read"`
		StartDate       time.Time `json:"start_date"`
		CompletedStatus bool      `json:"competed_status"`
		Reflection      string    `json:"reflection"`
		CompletedDate   time.Time `json:"completed_date"`
		StreakDays      int       `json:"streak_days"`
		LastUpdated     time.Time `json:"last_updated"`
	}

	var returnvalues []ans

	for i := 0; i < len(BooksInProgress); i++ {

		_ = books.FindOne(context.Background(), bson.M{"_id": BooksInProgress[i].BookID}).Decode(&book)
		fmt.Println("book id for progress", BooksInProgress[i].BookID)
		var temp ans
		temp.Title = book.Title
		temp.Author = book.Author
		temp.ISBN = BooksInProgress[i].ISBN
		temp.TotalPage = BooksInProgress[i].TotalPages
		temp.PagesRead = BooksInProgress[i].PagesRead
		temp.StartDate = BooksInProgress[i].StartedReading
		temp.CompletedStatus = BooksInProgress[i].Completed
		temp.Reflection = BooksInProgress[i].Reflection
		temp.CompletedDate = BooksInProgress[i].FinishedReading
		temp.StreakDays = BooksInProgress[i].StreakDays
		temp.LastUpdated = BooksInProgress[i].LastUpdated
		// now append it to the return value
		returnvalues = append(returnvalues, temp)

	}

	for j := 0; j < len(BooksReading); j++ {
		err = books.FindOne(context.Background(), bson.M{"_id": BooksReading[j].BookID}).Decode(&book)
		if err != nil {
			continue
		}
		fmt.Println("book id for reading", BooksReading[j].BookID)
		var temp ans
		temp.Title = book.Title
		temp.Author = book.Author
		temp.ISBN = BooksReading[j].ISBN
		temp.TotalPage = book.TotalPages
		temp.PagesRead = 0
		temp.StartDate = BooksReading[j].StartedReading
		temp.CompletedStatus = false
		temp.Reflection = ""
		temp.StreakDays = 0
		// now append it to the return value
		returnvalues = append(returnvalues, temp)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{"your reading progress": returnvalues})

}

// GET /user-borrow-history

func (h *BookHandler) ShowBorrowHistory(w http.ResponseWriter, r *http.Request) {

	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}

	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil {
		http.Error(w, "error while parsing the token", http.StatusUnauthorized)
		return
	}

	if !token.Valid {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return

	}

	claims, ok := token.Claims.(jwt.MapClaims)

	if !ok || claims["role"] != "student" {
		http.Error(w, "student access required", http.StatusForbidden)
		return
	}

	studentID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))

	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	BorrowHistories := h.DB.Collection("BorrowHistory")
	var borrowHistory []models.BorrowHistory

	curser, err := BorrowHistories.Find(context.Background(), bson.M{"user_id": studentID})

	if err != nil {
		http.Error(w, "error while parsing borrow history", http.StatusInternalServerError)
		return
	}

	defer curser.Close(context.Background())

	if err := curser.All(context.Background(), &borrowHistory); err != nil {
		http.Error(w, "error while loading a book", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(borrowHistory)

}
func (h *BookHandler) UpdateBook(w http.ResponseWriter, r *http.Request) {
	// Verify JWT
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, `{"error": "Missing token"}`, http.StatusUnauthorized)
		return
	}
	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		http.Error(w, `{"error": "Invalid token"}`, http.StatusUnauthorized)
		return
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["role"] != "admin" {
		http.Error(w, `{"error": "Admin role required"}`, http.StatusForbidden)
		return
	}

	// Get admin_id
	adminID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid admin ID"}`, http.StatusBadRequest)
		return
	}

	// Check admin exists
	users := h.DB.Collection("users")
	var admin models.User
	err = users.FindOne(context.Background(), bson.M{"_id": adminID, "role": "admin"}).Decode(&admin)
	if err != nil {
		http.Error(w, `{"error": "Admin not found"}`, http.StatusForbidden)
		return
	}

	// Define input struct with pointers for optional fields
	type BookInput struct {
		ISBN                    string  `json:"isbn"`
		Title                   *string `json:"title"`
		Author                  *string `json:"author"`
		Type                    *string `json:"type"`
		PhysicalLocation        *string `json:"physical_location"`
		PhoneNumberOfTheHandler *string `json:"phone_number_of_the_handler"`
		SoftcopyURL             *string `json:"softcopy_url"`
		AboutTheBook            *string `json:"about_the_book"`
		TotalPages              *int    `json:"total_pages"`
	}

	var input BookInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error": "Invalid input"}`, http.StatusBadRequest)
		return
	}

	// Validate ISBN
	if input.ISBN == "" {
		http.Error(w, `{"error": "ISBN is required"}`, http.StatusBadRequest)
		return
	}

	// Find existing book
	books := h.DB.Collection("books")
	var book models.Book
	err = books.FindOne(context.Background(), bson.M{"isbn": input.ISBN}).Decode(&book)
	if err != nil {
		http.Error(w, `{"error": "Book not found"}`, http.StatusNotFound)
		return
	}

	// Build dynamic update query
	updateFields := bson.M{}
	if input.Title != nil {
		updateFields["title"] = *input.Title
	}
	if input.Author != nil {
		updateFields["author"] = *input.Author
	}
	if input.AboutTheBook != nil {
		updateFields["about_the_book"] = *input.AboutTheBook
	}
	if input.TotalPages != nil {
		if *input.TotalPages < 0 {
			http.Error(w, `{"error": "Total pages must be non-negative"}`, http.StatusBadRequest)
			return
		}
		updateFields["total_pages"] = *input.TotalPages
	}

	// Handle type-specific fields
	currentType := book.Type
	if input.Type != nil {
		if *input.Type != "hardcopy" && *input.Type != "softcopy" {
			http.Error(w, `{"error": "Type must be hardcopy or softcopy"}`, http.StatusBadRequest)
			return
		}
		currentType = *input.Type
		updateFields["type"] = *input.Type
	}

	switch currentType {
	case "hardcopy":
		if input.PhysicalLocation != nil {
			updateFields["physical_location"] = *input.PhysicalLocation
		} else if book.PhysicalLocation == "" {
			http.Error(w, `{"error": "Physical location required for hardcopy"}`, http.StatusBadRequest)
			return
		}
		if input.PhoneNumberOfTheHandler != nil {
			updateFields["phone_number_of_the_handler"] = *input.PhoneNumberOfTheHandler
		} else if book.PhoneNumberOfTheHandler == "" {
			http.Error(w, `{"error": "Phone number of the handler required for hardcopy"}`, http.StatusBadRequest)
			return
		}
		if input.SoftcopyURL != nil {
			updateFields["softcopy_url"] = ""
		}
	case "softcopy":
		// Ensure SoftcopyURL is valid
		if input.SoftcopyURL != nil {
			updateFields["softcopy_url"] = *input.SoftcopyURL
		} else if book.SoftcopyURL == "" {
			http.Error(w, `{"error": "Softcopy URL required for softcopy"}`, http.StatusBadRequest)
			return
		}
		if input.PhysicalLocation != nil {
			updateFields["physical_location"] = ""
		}
		if input.PhoneNumberOfTheHandler != nil {
			updateFields["phone_number_of_the_handler"] = ""
		}
	}

	// If no fields to update, return early
	if len(updateFields) == 0 {
		http.Error(w, `{"error": "No fields provided to update"}`, http.StatusBadRequest)
		return
	}

	// Execute update
	result, err := books.UpdateOne(context.Background(), bson.M{"isbn": input.ISBN}, bson.M{"$set": updateFields})
	if err != nil {
		http.Error(w, `{"error": "Failed to update book"}`, http.StatusInternalServerError)
		return
	}
	if result.MatchedCount == 0 {
		http.Error(w, `{"error": "Book not found"}`, http.StatusNotFound)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Book updated successfully"})
}

// GET /check-book-readers
func (h *BookHandler) CheckBookReaders(w http.ResponseWriter, r *http.Request) {
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, `{"error": "Token is required"}`, http.StatusUnauthorized)
		return
	}
	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		http.Error(w, `{"error": "Invalid token"}`, http.StatusForbidden)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["role"] != "admin" {
		http.Error(w, `{"error": "Admin access required"}`, http.StatusUnauthorized)
		return
	}

	AdminID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Could not parse admin ID"}`, http.StatusBadRequest)
		return
	}

	users := h.DB.Collection("users")
	var user models.User
	err = users.FindOne(context.Background(), bson.M{"_id": AdminID, "role": "admin"}).Decode(&user)
	if err != nil {
		http.Error(w, `{"error": "Admin does not exist"}`, http.StatusForbidden)
		return
	}

	var input struct {
		ISBN string `json:"isbn"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error": "Error parsing input"}`, http.StatusBadRequest)
		return
	}
	isbn := input.ISBN
	if isbn == "" {
		http.Error(w, `{"error": "ISBN is required"}`, http.StatusBadRequest)
		return
	}

	// Find the book
	books := h.DB.Collection("books")
	var book models.Book
	err = books.FindOne(context.Background(), bson.M{"isbn": isbn}).Decode(&book)
	if err != nil {
		http.Error(w, `{"error": "Book not found"}`, http.StatusNotFound)
		return
	}

	// Check for active readers (finished_reading does not exist)
	reading := h.DB.Collection("reading")
	cursor, err := reading.Find(context.Background(), bson.M{
		"book_id":          book.ID,
		"finished_reading": bson.M{"$exists": false},
	})
	if err != nil {
		http.Error(w, `{"error": "Error checking active readers"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var activeReaders []struct {
		UserID   primitive.ObjectID `bson:"user_id"`
		ReaderID string             `bson:"reader_id"`
	}
	if err := cursor.All(context.Background(), &activeReaders); err != nil {
		http.Error(w, `{"error": "Error fetching active readers"}`, http.StatusInternalServerError)
		return
	}

	// Fetch user details for active readers
	var readerDetails []map[string]string
	for _, reader := range activeReaders {
		var readerUser models.User
		err := users.FindOne(context.Background(), bson.M{"_id": reader.UserID}).Decode(&readerUser)
		if err != nil {
			continue // Skip if user not found
		}
		readerDetails = append(readerDetails, map[string]string{
			"reader_id": reader.ReaderID,
			"name":      readerUser.Name,
			"email":     readerUser.Email,
		})
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"isbn":           isbn,
		"active_readers": readerDetails,
	})
}

// DELETE /delete-book (hard delete book, mark reviews orphaned)
func (h *BookHandler) DeleteBook(w http.ResponseWriter, r *http.Request) {
	// ===== JWT Authentication =====
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, `{"error": "Token is required"}`, http.StatusUnauthorized)
		return
	}
	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		http.Error(w, `{"error": "Invalid token"}`, http.StatusForbidden)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["role"] != "admin" {
		http.Error(w, `{"error": "Admin access required"}`, http.StatusUnauthorized)
		return
	}

	AdminID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Could not parse admin ID"}`, http.StatusBadRequest)
		return
	}

	users := h.DB.Collection("users")
	var user models.User
	err = users.FindOne(context.Background(), bson.M{"_id": AdminID, "role": "admin"}).Decode(&user)
	if err != nil {
		http.Error(w, `{"error": "Admin does not exist"}`, http.StatusForbidden)
		return
	}

	// ===== Parse input =====
	var input struct {
		ISBN     string `json:"isbn"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error": "Error parsing input"}`, http.StatusBadRequest)
		return
	}
	if input.ISBN == "" || input.Password == "" {
		http.Error(w, `{"error": "ISBN and password are required"}`, http.StatusBadRequest)
		return
	}

	// ===== Check password =====
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		http.Error(w, `{"error": "Incorrect password"}`, http.StatusUnauthorized)
		return
	}

	// ===== Find the book =====
	books := h.DB.Collection("books")
	var book models.Book
	err = books.FindOne(context.Background(), bson.M{"isbn": input.ISBN}).Decode(&book)
	if err == mongo.ErrNoDocuments {
		http.Error(w, `{"error": "Book does not exist"}`, http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, `{"error": "Error checking book"}`, http.StatusInternalServerError)
		return
	}

	// ===== Delete the book (hard delete) =====
	result, err := books.DeleteOne(context.Background(), bson.M{"isbn": input.ISBN})
	if err != nil || result.DeletedCount == 0 {
		http.Error(w, `{"error": "Error deleting book"}`, http.StatusInternalServerError)
		return
	}

	// ===== Mark related reviews as orphaned =====
	reviewsCol := h.DB.Collection("Reviews")
	_, err = reviewsCol.UpdateMany(
		context.Background(),
		bson.M{"book_id": book.ID},
		bson.M{"$set": bson.M{"book_deleted": true}},
	)
	if err != nil {
		http.Error(w, `{"error": "Error marking reviews as orphaned"}`, http.StatusInternalServerError)
		return
	}

	// ===== Success response =====
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Book deleted successfully; related reviews marked as orphaned",
	})
}

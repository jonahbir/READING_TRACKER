package handlers

import (
	"context"
	"encoding/json"

	"log"
	"net/http"
	"os"

	"github.com/jonahbir/reading_tracker/helpers"
	"github.com/jonahbir/reading_tracker/models"

	"strconv"
	"time"

	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SocialHandler struct {
	DB *mongo.Database
}

func (h *SocialHandler) PublicReviews(w http.ResponseWriter, r *http.Request) {
	// Get optional isbn query param
	isbn := r.URL.Query().Get("isbn")

	var bookID primitive.ObjectID
	if isbn != "" {
		// Find book by ISBN
		booksCol := h.DB.Collection("books")
		var book models.Book
		err := booksCol.FindOne(context.Background(), bson.M{"isbn": isbn}).Decode(&book)
		if err != nil {
			http.Error(w, `{"error": "Book not found"}`, http.StatusNotFound)
			return
		}
		bookID = book.ID
	}

	// Build filter for Reviews
	filter := bson.M{
		"posted":          true,
		"book_deleted":    false,
		"ai_check_status": "approved",
	}
	if isbn != "" {
		filter["book_id"] = bookID
	}

	// Query Reviews collection
	reviewsCol := h.DB.Collection("Reviews")
	cursor, err := reviewsCol.Find(context.Background(), filter)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch reviews"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	// Prepare response
	type ReviewResponse struct {
		ID         primitive.ObjectID `json:"_id"`
		ReaderID   string             `json:"reader_id"`
		ReviewText string             `json:"review_text"`
		Upvotes    int                `json:"upvotes"`
		CreatedAt  time.Time          `json:"created_at"`
	}

	var results []ReviewResponse
	for cursor.Next(context.Background()) {
		var rev models.Review
		if err := cursor.Decode(&rev); err != nil {
			http.Error(w, `{"error": "Failed to decode review"}`, http.StatusInternalServerError)
			return
		}
		results = append(results, ReviewResponse{
			ID:         rev.ID,
			ReaderID:   rev.ReaderID,
			ReviewText: rev.ReviewText,
			Upvotes:    rev.Upvotes,
			CreatedAt:  rev.CreatedAt,
		})
	}
	// Return JSON response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{"reviews": results})
}

func (h *SocialHandler) ToggleUpvote(w http.ResponseWriter, r *http.Request) {
	// ===== JWT Authentication =====
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
	if !ok {
		http.Error(w, `{"error": "Invalid token claims"}`, http.StatusUnauthorized)
		return
	}

	userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid user ID"}`, http.StatusBadRequest)
		return
	}

	// ===== Parse input =====
	type Input struct {
		ReviewID string `json:"review_id"`
	}
	var input Input
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error": "Invalid input"}`, http.StatusBadRequest)
		return
	}

	reviewID, err := primitive.ObjectIDFromHex(input.ReviewID)
	if err != nil {
		http.Error(w, `{"error": "Invalid review ID"}`, http.StatusBadRequest)
		return
	}

	reviewsCol := h.DB.Collection("Reviews")

	// ===== Check if review exists =====
	var review models.Review
	err = reviewsCol.FindOne(
		context.Background(),
		bson.M{
			"_id": reviewID,
			"$or": []bson.M{
				{"book_deleted": false},
				{"book_deleted": bson.M{"$exists": false}},
			},
		}).Decode(&review)
	if err != nil {
		http.Error(w, `{"error": "Review not found"}`, http.StatusNotFound)
		return
	}

	// ===== Check if user already upvoted =====
	alreadyLiked := false
	for _, id := range review.UpvotedBy {
		if id == userID {
			alreadyLiked = true
			break
		}
	}

	// ===== Toggle logic =====
	var update bson.M
	var message string
	var scoreDelta int

	if alreadyLiked {
		update = bson.M{
			"$inc":  bson.M{"upvotes": -1},
			"$pull": bson.M{"upvoted_by": userID},
		}
		message = "Review unliked successfully"
		scoreDelta = -2
	} else {
		update = bson.M{
			"$inc":      bson.M{"upvotes": 1},
			"$addToSet": bson.M{"upvoted_by": userID},
		}
		message = "Review liked successfully"
		scoreDelta = +2
	}

	// ===== Perform update =====
	_, err = reviewsCol.UpdateOne(
		context.Background(),
		bson.M{
			"_id":             reviewID,
			"posted":          true,
			"ai_check_status": "approved",
		},
		update,
	)
	if err != nil {
		fmt.Println(err)
		http.Error(w, `{"error": "Failed to update review"}`, http.StatusInternalServerError)
		return
	}
	// after updating upvotes in DB
	if !alreadyLiked {
		// notify review author
		go helpers.CreateNotification(
			h.DB,
			review.UserID,   // recipient (the review's author)
			userID,          // actor (the one upvoting)
			review.ID,       // target (the review itself)
			"upvote_review", // type
		)
	}
	// ===== Update leaderboard score for review's author =====
	if scoreDelta != 0 {
		if err := helpers.UpdateRankScore(h.DB, review.UserID, scoreDelta); err != nil {
			log.Printf("failed to update rank score for user %s: %v", review.UserID.Hex(), err)
		}
	}

	// ===== Return updated review =====
	err = reviewsCol.FindOne(context.Background(), bson.M{"_id": reviewID, "book_deleted": false}).Decode(&review)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch updated review"}`, http.StatusInternalServerError)
		return
	}

	// ===== Update badges/class tags =====
	helpers.UpdateUserBadgesAndClassTag(review.UserID, h.DB)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"message": message,
		"upvotes": review.Upvotes,
	})
}

func (h *SocialHandler) PostCommentReview(w http.ResponseWriter, r *http.Request) {
	// ===== JWT Authentication =====
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
	if !ok {
		http.Error(w, `{"error": "Invalid token claims"}`, http.StatusUnauthorized)
		return
	}

	userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid user ID"}`, http.StatusBadRequest)
		return
	}

	// ===== Parse input =====
	var input struct {
		ReviewID string `json:"review_id"`
		Text     string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error": "Invalid input"}`, http.StatusBadRequest)
		return
	}
	if input.ReviewID == "" || input.Text == "" {
		http.Error(w, `{"error": "review_id and text are required"}`, http.StatusBadRequest)
		return
	}

	reviewID, err := primitive.ObjectIDFromHex(input.ReviewID)
	if err != nil {
		http.Error(w, `{"error": "Invalid review ID"}`, http.StatusBadRequest)
		return
	}

	// ===== Insert comment =====
	commentsCol := h.DB.Collection("ReviewComments")

	newComment := bson.M{
		"review_id":  reviewID,
		"user_id":    userID,
		"text":       input.Text,
		"upvotes":    0,
		"upvoted_by": []primitive.ObjectID{},
		"created_at": time.Now(),
	}

	_, err = commentsCol.InsertOne(context.Background(), newComment)
	if err != nil {
		http.Error(w, `{"error": "Failed to post comment"}`, http.StatusInternalServerError)
		return
	}

	// after saving the comment
	go helpers.CreateNotification(
		h.DB,
		userID,           // recipient = review owner
		userID,           // actor = commenter
		reviewID,         // target = review
		"comment_review", // type
	)

	// ===== Award points to the review author =====
	reviewsCol := h.DB.Collection("Reviews")
	var review models.Review
	if err := reviewsCol.FindOne(context.Background(), bson.M{"_id": reviewID}).Decode(&review); err == nil {
		_ = helpers.UpdateRankScore(h.DB, review.UserID, 1) // 1 point to review author
		_ = helpers.UpdateUserBadgesAndClassTag(review.UserID, h.DB)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Comment posted successfully",
	})
}

func (h *SocialHandler) ToggleCommentUpvoteReview(w http.ResponseWriter, r *http.Request) {
	// ===== JWT Authentication =====
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
	if !ok {
		http.Error(w, `{"error": "Invalid token claims"}`, http.StatusUnauthorized)
		return
	}

	userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid user ID"}`, http.StatusBadRequest)
		return
	}

	// ===== Parse input =====
	var input struct {
		CommentID string `json:"comment_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error": "Invalid input"}`, http.StatusBadRequest)
		return
	}

	commentID, err := primitive.ObjectIDFromHex(input.CommentID)
	if err != nil {
		http.Error(w, `{"error": "Invalid comment ID"}`, http.StatusBadRequest)
		return
	}

	commentsCol := h.DB.Collection("ReviewComments")

	// ===== Fetch comment =====
	var comment struct {
		ID        primitive.ObjectID   `bson:"_id"`
		UserID    primitive.ObjectID   `bson:"user_id"`
		Upvotes   int                  `bson:"upvotes"`
		UpvotedBy []primitive.ObjectID `bson:"upvoted_by"`
	}
	if err := commentsCol.FindOne(context.Background(), bson.M{"_id": commentID}).Decode(&comment); err != nil {
		http.Error(w, `{"error": "Comment not found"}`, http.StatusNotFound)
		return
	}

	alreadyLiked := false
	for _, id := range comment.UpvotedBy {
		if id == userID {
			alreadyLiked = true
			break
		}
	}

	var update bson.M
	var message string
	var scoreDelta int

	if alreadyLiked {
		update = bson.M{"$inc": bson.M{"upvotes": -1}, "$pull": bson.M{"upvoted_by": userID}}
		message = "Comment unliked successfully"
		scoreDelta = -1 // 1 point to comment author per upvote removed
	} else {
		update = bson.M{"$inc": bson.M{"upvotes": 1}, "$addToSet": bson.M{"upvoted_by": userID}}
		message = "Comment liked successfully"
		scoreDelta = 1 // 1 point to comment author per upvote
	}

	_, err = commentsCol.UpdateOne(context.Background(), bson.M{"_id": commentID}, update)
	if err != nil {
		http.Error(w, `{"error": "Failed to update comment"}`, http.StatusInternalServerError)
		return
	}

	// ===== Update comment author's rank score =====
	if scoreDelta != 0 {
		_ = helpers.UpdateRankScore(h.DB, comment.UserID, scoreDelta)
		_ = helpers.UpdateUserBadgesAndClassTag(comment.UserID, h.DB)
	}
	if !alreadyLiked {
		go helpers.CreateNotification(
			h.DB,
			comment.UserID,
			userID,
			comment.ID,
			"upvote_comment",
		)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": message,
	})
}

// GET /leaderboard
func (h *SocialHandler) Leaderboard(w http.ResponseWriter, r *http.Request) {
	usersCol := h.DB.Collection("users")

	// Optional: limit number of users returned via query param ?limit=10
	limit := int64(10) // default top 10
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.ParseInt(l, 10, 64); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	// Query users, sort by rank_score descending
	cursor, err := usersCol.Find(
		context.Background(),
		bson.M{}, // fetch all users
		&options.FindOptions{
			Sort:  bson.M{"rank_score": -1},
			Limit: &limit,
		},
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch leaderboard"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	type LeaderboardUser struct {
		Name      string   `json:"name"`
		ReaderID  string   `json:"reader_id"`
		RankScore int      `json:"rank_score"`
		BooksRead int      `json:"books_read"`
		ClassTag  string   `json:"class_tag"`
		Badges    []string `json:"badges,omitempty"`
	}

	badgesCol := h.DB.Collection("Badges")
	cursorBadges, err := badgesCol.Find(context.Background(), bson.M{})
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch badges"}`, http.StatusInternalServerError)
		return
	}
	defer cursorBadges.Close(context.Background())

	// Map userID to badges
	userBadges := make(map[primitive.ObjectID][]string)
	for cursorBadges.Next(context.Background()) {
		var badge struct {
			UserID primitive.ObjectID `bson:"user_id"`
			Name   string             `bson:"name"`
		}
		if err := cursorBadges.Decode(&badge); err != nil {
			continue
		}
		userBadges[badge.UserID] = append(userBadges[badge.UserID], badge.Name)
	}
	// Build leaderboard
	var leaderboard []LeaderboardUser
	for cursor.Next(context.Background()) {
		var user models.User
		if err := cursor.Decode(&user); err != nil {
			continue
		}
		if user.Role == "admin" { // exclude admins from leaderboard
			continue
		}

		leaderboard = append(leaderboard, LeaderboardUser{
			Name:      user.Name,
			ReaderID:  user.ReaderID,
			RankScore: user.RankScore,
			BooksRead: user.BooksRead,
			ClassTag:  user.ClassTag,
			Badges:    userBadges[user.ID], // attach badges
		})
	}

	// Return leaderboard
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"leaderboard": leaderboard,
		"count":       len(leaderboard),
	})
}

func (h *SocialHandler) UserProfile(w http.ResponseWriter, r *http.Request) {
	// ===== JWT Authentication =====
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
	if !ok {
		http.Error(w, `{"error": "Invalid token claims"}`, http.StatusUnauthorized)
		return
	}

	requesterID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid requester ID"}`, http.StatusBadRequest)
		return
	}
	requesterRole := claims["role"].(string)

	// ===== Target user from query param =====
	targetIDStr := r.URL.Query().Get("target_id")
	var targetID primitive.ObjectID
	if targetIDStr == "" || targetIDStr == requesterID.Hex() {
		targetID = requesterID // self profile
	} else {
		targetID, err = primitive.ObjectIDFromHex(targetIDStr)
		if err != nil {
			http.Error(w, `{"error": "Invalid target user ID"}`, http.StatusBadRequest)
			return
		}
	}

	// ===== Fetch target user =====
	usersCol := h.DB.Collection("users")
	var user models.User
	err = usersCol.FindOne(context.Background(), bson.M{"_id": targetID, "verified": true}).Decode(&user)
	if err != nil {
		http.Error(w, `{"error": "User not found or not verified"}`, http.StatusNotFound)
		return
	}

	// ===== Borrow history =====
	borrowCol := h.DB.Collection("BorrowHistory")
	cursor, _ := borrowCol.Find(context.Background(), bson.M{"user_id": targetID})
	defer cursor.Close(context.Background())

	var borrowHistory []map[string]interface{}
	for cursor.Next(context.Background()) {
		var bh models.BorrowHistory
		if err := cursor.Decode(&bh); err != nil {
			continue
		}

		// fetch book title
		bookCol := h.DB.Collection("books")
		var book models.Book
		_ = bookCol.FindOne(context.Background(), bson.M{"_id": bh.BookID}).Decode(&book)

		borrowHistory = append(borrowHistory, map[string]any{
			"book_title":  book.Title,
			"borrow_date": bh.BorrowDate.Format("2006-01-02"),
			"return_date": func() string {
				if !bh.ReturnDate.IsZero() {
					return bh.ReturnDate.Format("2006-01-02")
				}
				return ""
			}(),
			"returned": !bh.ReturnDate.IsZero(),
		})
	}

	// ===== Fetch badges =====
	badgesCol := h.DB.Collection("Badges")
	badgeCursor, _ := badgesCol.Find(context.Background(), bson.M{"user_id": targetID})
	defer badgeCursor.Close(context.Background())

	var badges []string
	for badgeCursor.Next(context.Background()) {
		var b struct {
			Name string `bson:"name"`
		}
		if err := badgeCursor.Decode(&b); err != nil {
			continue
		}
		badges = append(badges, b.Name)
	}

	// ===== Base profile =====
	profile := map[string]any{
		"name":           user.Name,
		"reader_id":      user.ReaderID,
		"class_tag":      user.ClassTag,
		"rank_score":     user.RankScore,
		"books_read":     user.BooksRead,
		"badges":         badges,
		"borrow_history": borrowHistory,
	}

	// ===== Add sensitive info if self or admin =====
	if requesterID == targetID || requesterRole == "admin" {
		profile["email"] = user.Email
		profile["dorm_number"] = user.DormNumber
		profile["insa_batch"] = user.InsaBatch
		profile["educational_status"] = user.EducationalStatus
	}

	// ===== Return JSON =====
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(profile)
}

// GET /recommendations
func (h *SocialHandler) GetRecommendations(w http.ResponseWriter, r *http.Request) {

	// ===== Authenticate User =====
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

	// ===== Fetch completed books =====
	progressCol := h.DB.Collection("ReadingProgress")
	cursor, err := progressCol.Find(context.Background(), bson.M{
		"user_id":   userID,
		"completed": true,
	})
	if err != nil {
		http.Error(w, "Failed to fetch reading history", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var completed []models.ReadingProgress
	if err := cursor.All(context.Background(), &completed); err != nil {
		http.Error(w, "Error decoding reading history", http.StatusInternalServerError)
		return
	}

	if len(completed) == 0 {
		http.Error(w, "No completed books found. Keep reading to get recommendations!", http.StatusNotFound)
		return
	}

	// ===== Collect genres & authors =====
	booksCol := h.DB.Collection("books")
	var genres []string
	var authors []string
	var readBookIDs []primitive.ObjectID

	for _, prog := range completed {
		var book models.Book
		err := booksCol.FindOne(context.Background(), bson.M{"_id": prog.BookID}).Decode(&book)
		if err == nil {
			if book.Genre != "" {
				genres = append(genres, book.Genre)
			}
			if book.Author != "" {
				authors = append(authors, book.Author)
			}
			readBookIDs = append(readBookIDs, book.ID)
		}
	}

	recommendations := []models.Book{}
	seen := make(map[primitive.ObjectID]bool)

	// ===== 1. Recommend by Genre =====
	if len(genres) > 0 {
		cursor, err := booksCol.Find(context.Background(), bson.M{
			"_id":   bson.M{"$nin": readBookIDs},
			"genre": bson.M{"$in": genres},
		}, options.Find().SetLimit(8))
		if err == nil {
			var genreBooks []models.Book
			if err := cursor.All(context.Background(), &genreBooks); err == nil {
				for _, b := range genreBooks {
					if !seen[b.ID] {
						recommendations = append(recommendations, b)
						seen[b.ID] = true
					}
				}
			}
			cursor.Close(context.Background())
		}
	}

	// ===== 2. Recommend by Author =====
	if len(recommendations) < 8 && len(authors) > 0 {
		limit := int64(8 - len(recommendations))
		cursor, err := booksCol.Find(context.Background(), bson.M{
			"_id":    bson.M{"$nin": readBookIDs},
			"author": bson.M{"$in": authors},
		}, options.Find().SetLimit(limit))
		if err == nil {
			var authorBooks []models.Book
			if err := cursor.All(context.Background(), &authorBooks); err == nil {
				for _, b := range authorBooks {
					if !seen[b.ID] {
						recommendations = append(recommendations, b)
						seen[b.ID] = true
					}
				}
			}
			cursor.Close(context.Background())
		}
	}

	// ===== 3. Fill with Random Books ===
	if readBookIDs == nil {
		readBookIDs = []primitive.ObjectID{}
	}

	// ===== 3. Fill with Random Books =====
	if len(recommendations) < 8 {
		limit := 8 - len(recommendations)

		cursor, err := booksCol.Aggregate(context.Background(), mongo.Pipeline{
			bson.D{{Key: "$match", Value: bson.M{
				"_id": bson.M{"$nin": readBookIDs},
			}}},
			bson.D{{Key: "$sample", Value: bson.M{"size": limit}}},
		})
		if err == nil {
			var randomBooks []models.Book
			if err := cursor.All(context.Background(), &randomBooks); err == nil {
				for _, b := range randomBooks {
					if !seen[b.ID] {
						recommendations = append(recommendations, b)
						seen[b.ID] = true
					}
				}
			}
			cursor.Close(context.Background())
		}
	}

	// ===== Response =====
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"count":           len(recommendations),
		"recommendations": recommendations,
	})
}

func (h *SocialHandler) AddQuote(w http.ResponseWriter, r *http.Request) {
	// ===== JWT Authentication =====
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
	if !ok || claims["role"] != "student" {
		http.Error(w, `{"error": "Student access required"}`, http.StatusForbidden)
		return
	}

	userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid user ID"}`, http.StatusBadRequest)
		return
	}

	// ===== Parse request body =====
	type Input struct {
		Text string `json:"text"`
	}
	var input Input
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error": "Invalid input"}`, http.StatusBadRequest)
		return
	}

	if input.Text == "" {
		http.Error(w, `{"error": "Quote text cannot be empty"}`, http.StatusBadRequest)
		return
	}

	// ===== Insert into Quotes collection =====
	quotesCol := h.DB.Collection("Quotes")
	quote := bson.M{
		"user_id":    userID,
		"text":       input.Text,
		"upvotes":    0,
		"created_at": time.Now(),
	}

	res, err := quotesCol.InsertOne(context.Background(), quote)
	if err != nil {
		http.Error(w, `{"error": "Failed to add quote"}`, http.StatusInternalServerError)
		return
	}

	// ===== Update user badges & rank score =====
	if err := helpers.UpdateUserBadgesAndClassTag(userID, h.DB); err != nil {
		log.Printf("failed to update badges for user %s: %v", userID.Hex(), err)
	}

	// ===== Respond with the new quote ID =====
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "Quote added successfully",
		"quote_id": res.InsertedID,
	})
}

func (h *SocialHandler) ToggleUpvoteQuote(w http.ResponseWriter, r *http.Request) {
	// ===== JWT Authentication =====
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
	if !ok {
		http.Error(w, `{"error": "Invalid token claims"}`, http.StatusUnauthorized)
		return
	}

	userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid user ID"}`, http.StatusBadRequest)
		return
	}

	// ===== Get quote ID from URL =====
	// Assume URL pattern: /quotes/upvote?id=<quoteID>
	quoteIDStr := r.URL.Query().Get("id")
	if quoteIDStr == "" {
		http.Error(w, `{"error": "Missing quote ID"}`, http.StatusBadRequest)
		return
	}

	quoteID, err := primitive.ObjectIDFromHex(quoteIDStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid quote ID"}`, http.StatusBadRequest)
		return
	}

	quotesCol := h.DB.Collection("Quotes")

	// ===== Find the quote =====
	var quote struct {
		ID        primitive.ObjectID   `bson:"_id"`
		UserID    primitive.ObjectID   `bson:"user_id"`
		Upvotes   int                  `bson:"upvotes"`
		UpvotedBy []primitive.ObjectID `bson:"upvoted_by"`
	}

	err = quotesCol.FindOne(context.Background(), bson.M{"_id": quoteID}).Decode(&quote)
	if err != nil {
		http.Error(w, `{"error": "Quote not found"}`, http.StatusNotFound)
		return
	}

	// ===== Toggle upvote =====
	alreadyLiked := false
	for _, id := range quote.UpvotedBy {
		if id == userID {
			alreadyLiked = true
			break
		}
	}

	var update bson.M
	var message string
	var scoreDelta int

	if alreadyLiked {
		update = bson.M{
			"$inc":  bson.M{"upvotes": -1},
			"$pull": bson.M{"upvoted_by": userID},
		}
		message = "Quote unliked successfully"
		scoreDelta = -2
	} else {
		update = bson.M{
			"$inc":      bson.M{"upvotes": 1},
			"$addToSet": bson.M{"upvoted_by": userID},
		}
		message = "Quote liked successfully"
		scoreDelta = +2
	}

	_, err = quotesCol.UpdateOne(context.Background(), bson.M{"_id": quoteID}, update)
	if err != nil {
		http.Error(w, `{"error": "Failed to update quote"}`, http.StatusInternalServerError)
		return
	}

	// ===== Update author rank score =====
	if scoreDelta != 0 {
		_ = helpers.UpdateRankScore(h.DB, quote.UserID, scoreDelta)
		helpers.UpdateUserBadgesAndClassTag(quote.UserID, h.DB)
	}

	// ===== Return updated quote info =====
	err = quotesCol.FindOne(context.Background(), bson.M{"_id": quoteID}).Decode(&quote)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch updated quote"}`, http.StatusInternalServerError)
		return
	}
	if !alreadyLiked {
		go helpers.CreateNotification(
			h.DB,
			quote.UserID,
			userID,
			quote.ID,
			"upvote_quote",
		)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": message,
		"upvotes": quote.Upvotes,
	})
}

func (h *SocialHandler) AddCommentQuote(w http.ResponseWriter, r *http.Request) {
	// ===== JWT Authentication =====
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
	if !ok || claims["role"] != "student" {
		http.Error(w, `{"error": "Student access required"}`, http.StatusForbidden)
		return
	}

	userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid user ID"}`, http.StatusBadRequest)
		return
	}

	// ===== Parse input from body =====
	var input struct {
		QuoteID string `json:"quote_id"`
		Text    string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error": "Invalid input"}`, http.StatusBadRequest)
		return
	}
	if input.QuoteID == "" || input.Text == "" {
		http.Error(w, `{"error": "quote_id and text are required"}`, http.StatusBadRequest)
		return
	}

	quoteID, err := primitive.ObjectIDFromHex(input.QuoteID)
	if err != nil {
		http.Error(w, `{"error": "Invalid quote ID"}`, http.StatusBadRequest)
		return
	}

	quotesCol := h.DB.Collection("Quotes")
	commentsCol := h.DB.Collection("QuoteComments")

	// Check if the quote exists
	var quote struct {
		ID     primitive.ObjectID `bson:"_id"`
		UserID primitive.ObjectID `bson:"user_id"`
	}
	if err := quotesCol.FindOne(context.Background(), bson.M{"_id": quoteID}).Decode(&quote); err != nil {
		http.Error(w, `{"error": "Quote not found"}`, http.StatusNotFound)
		return
	}

	// Insert the comment
	comment := bson.M{
		"quote_id":   quoteID,
		"user_id":    userID,
		"text":       input.Text,
		"created_at": time.Now(),
	}
	_, err = commentsCol.InsertOne(context.Background(), comment)
	if err != nil {
		http.Error(w, `{"error": "Failed to add comment"}`, http.StatusInternalServerError)
		return
	}

	// Update rank score for comment author (0.5 points)
	_ = helpers.UpdateRankScore(h.DB, userID, 1) // if using integer, you can scale 0.5*2 = 1

	// Optionally: Update badges for the comment author
	_ = helpers.UpdateUserBadgesAndClassTag(userID, h.DB)
	// after saving comment
	go helpers.CreateNotification(
		h.DB,
		quote.UserID,
		userID,
		quote.ID,
		"comment_quote",
	)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Comment added successfully",
	})
}

func (h *SocialHandler) ToggleCommentUpvoteQuote(w http.ResponseWriter, r *http.Request) {
	// ===== JWT Authentication =====
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
	if !ok {
		http.Error(w, `{"error": "Invalid token claims"}`, http.StatusUnauthorized)
		return
	}

	userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid user ID"}`, http.StatusBadRequest)
		return
	}

	// ===== Parse comment ID from body =====
	var input struct {
		CommentID string `json:"comment_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error": "Invalid input"}`, http.StatusBadRequest)
		return
	}
	if input.CommentID == "" {
		http.Error(w, `{"error": "comment_id is required"}`, http.StatusBadRequest)
		return
	}

	commentID, err := primitive.ObjectIDFromHex(input.CommentID)
	if err != nil {
		http.Error(w, `{"error": "Invalid comment ID"}`, http.StatusBadRequest)
		return
	}

	commentsCol := h.DB.Collection("QuoteComments")

	// Fetch comment
	var comment struct {
		ID        primitive.ObjectID   `bson:"_id"`
		UserID    primitive.ObjectID   `bson:"user_id"`
		UpvotedBy []primitive.ObjectID `bson:"upvoted_by,omitempty"`
		Upvotes   int                  `bson:"upvotes"`
	}
	err = commentsCol.FindOne(context.Background(), bson.M{"_id": commentID}).Decode(&comment)
	if err != nil {
		http.Error(w, `{"error": "Comment not found"}`, http.StatusNotFound)
		return
	}

	alreadyLiked := false
	for _, id := range comment.UpvotedBy {
		if id == userID {
			alreadyLiked = true
			break
		}
	}

	var update bson.M
	var message string
	scoreDelta := 1 // 0.5 points scaled as 1

	if alreadyLiked {
		// Remove upvote
		update = bson.M{
			"$inc":  bson.M{"upvotes": -1},
			"$pull": bson.M{"upvoted_by": userID},
		}
		message = "Comment unliked successfully"
		scoreDelta = -1
	} else {
		// Add upvote
		update = bson.M{
			"$inc":      bson.M{"upvotes": 1},
			"$addToSet": bson.M{"upvoted_by": userID},
		}
		message = "Comment liked successfully"
		scoreDelta = 1
	}

	_, err = commentsCol.UpdateOne(context.Background(), bson.M{"_id": commentID}, update)
	if err != nil {
		http.Error(w, `{"error": "Failed to update comment"}`, http.StatusInternalServerError)
		return
	}

	// Update rank score of comment author
	_ = helpers.UpdateRankScore(h.DB, comment.UserID, scoreDelta)
	_ = helpers.UpdateUserBadgesAndClassTag(comment.UserID, h.DB)

	// Fetch updated comment
	err = commentsCol.FindOne(context.Background(), bson.M{"_id": commentID}).Decode(&comment)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch updated comment"}`, http.StatusInternalServerError)
		return
	}

	if !alreadyLiked {
		go helpers.CreateNotification(
			h.DB,
			comment.UserID,
			userID,
			comment.ID,
			"upvote_comment",
		)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": message,
		"upvotes": comment.Upvotes,
	})
}

// GET /notifications
func (h *SocialHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	// Authenticate
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
	claims, _ := token.Claims.(jwt.MapClaims)
	userID, _ := primitive.ObjectIDFromHex(claims["user_id"].(string))

	notificationsCol := h.DB.Collection("Notifications")

	cursor, err := notificationsCol.Find(
		context.Background(),
		bson.M{"user_id": userID},
		&options.FindOptions{
			Sort: bson.M{"created_at": -1}, // latest first
		},
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch notifications"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var notifications []models.Notification
	if err := cursor.All(context.Background(), &notifications); err != nil {
		http.Error(w, `{"error": "Failed to parse notifications"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"count":         len(notifications),
		"notifications": notifications,
	})
}

// POST /notifications/mark-seen
func (h *SocialHandler) MarkNotificationsSeen(w http.ResponseWriter, r *http.Request) {
	// Authenticate
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
	claims, _ := token.Claims.(jwt.MapClaims)
	userID, _ := primitive.ObjectIDFromHex(claims["user_id"].(string))

	notificationsCol := h.DB.Collection("Notifications")

	_, err = notificationsCol.UpdateMany(
		context.Background(),
		bson.M{"user_id": userID, "seen": false},
		bson.M{"$set": bson.M{"seen": true}},
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to mark notifications"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "All notifications marked as seen",
	})
}

func (h *SocialHandler) SearchReviews(w http.ResponseWriter, r *http.Request) {
	// ===== Parse query params =====
	query := r.URL.Query().Get("query")
	isbn := r.URL.Query().Get("isbn")
	userIDStr := r.URL.Query().Get("user_id")

	filter := bson.M{
		"review_text":     bson.M{"$regex": query, "$options": "i"},
		"posted":          true,
		"ai_check_status": "approved",
		"book_deleted":    false,
	}

	// Optional filters
	if isbn != "" {
		booksCol := h.DB.Collection("Books")
		var book models.Book
		err := booksCol.FindOne(context.Background(), bson.M{"isbn": isbn}).Decode(&book)
		if err == nil {
			filter["book_id"] = book.ID
		}
	}

	if userIDStr != "" {
		userID, err := primitive.ObjectIDFromHex(userIDStr)
		if err == nil {
			filter["user_id"] = userID
		}
	}

	reviewsCol := h.DB.Collection("Reviews")
	cursor, err := reviewsCol.Find(context.Background(), filter)
	if err != nil {
		http.Error(w, `{"error": "Failed to search reviews"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	type ReviewWithUser struct {
		ID         primitive.ObjectID `json:"id"`
		ReviewText string             `json:"review_text"`
		UserName   string             `json:"user_name"`
		ReaderID   string             `json:"reader_id"`
		BookID     primitive.ObjectID `json:"book_id"`
		Upvotes    int                `json:"upvotes"`
		CreatedAt  time.Time          `json:"created_at"`
	}

	var results []ReviewWithUser

	for cursor.Next(context.Background()) {
		var rev models.Review
		if err := cursor.Decode(&rev); err != nil {
			continue
		}

		// Fetch user info
		var user models.User
		usersCol := h.DB.Collection("users")
		_ = usersCol.FindOne(context.Background(), bson.M{"_id": rev.UserID}).Decode(&user)

		results = append(results, ReviewWithUser{
			ID:         rev.ID,
			ReviewText: rev.ReviewText,
			UserName:   user.Name,
			ReaderID:   user.ReaderID,
			BookID:     rev.BookID,
			Upvotes:    rev.Upvotes,
			CreatedAt:  rev.CreatedAt,
		})
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"count":   len(results),
		"reviews": results,
	})
}

func (h *SocialHandler) SearchQuotes(w http.ResponseWriter, r *http.Request) {
	// ===== Parse query params =====
	query := r.URL.Query().Get("query")
	userIDStr := r.URL.Query().Get("user_id")

	filter := bson.M{
		"text": bson.M{"$regex": query, "$options": "i"},
	}

	if userIDStr != "" {
		userID, err := primitive.ObjectIDFromHex(userIDStr)
		if err == nil {
			filter["user_id"] = userID
		}
	}

	quotesCol := h.DB.Collection("Quotes")
	cursor, err := quotesCol.Find(context.Background(), filter)
	if err != nil {
		http.Error(w, `{"error": "Failed to search quotes"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	type QuoteWithUser struct {
		ID        primitive.ObjectID `json:"id"`
		Text      string             `json:"text"`
		UserName  string             `json:"user_name"`
		ReaderID  string             `json:"reader_id"`
		Upvotes   int                `json:"upvotes"`
		CreatedAt time.Time          `json:"created_at"`
	}

	var results []QuoteWithUser
	usersCol := h.DB.Collection("users")

	for cursor.Next(context.Background()) {
		var q models.Quote
		if err := cursor.Decode(&q); err != nil {
			continue
		}

		// Fetch user info
		var user models.User
		_ = usersCol.FindOne(context.Background(), bson.M{"_id": q.AuthorID}).Decode(&user)

		results = append(results, QuoteWithUser{
			ID:        q.ID,
			Text:      q.Text,
			UserName:  user.Name,
			ReaderID:  user.ReaderID,
			Upvotes:   q.Upvotes,
			CreatedAt: q.CreatedAt,
		})
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"count":  len(results),
		"quotes": results,
	})
}

func (h *SocialHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	usersCol := h.DB.Collection("users")

	// ===== JWT Authentication =====
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
	if !ok {
		http.Error(w, `{"error": "Invalid token claims"}`, http.StatusUnauthorized)
		return
	}

	_, err = primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid user ID"}`, http.StatusBadRequest)
		return
	}

	userRole, _ := claims["role"].(string) // "admin" or "user"

	// ===== Parse query parameters =====
	query := r.URL.Query()
	filter := bson.M{}

	if name := query.Get("name"); name != "" {
		filter["name"] = bson.M{"$regex": name, "$options": "i"}
	}
	if insa := query.Get("insa_batch"); insa != "" {
		filter["insa_batch"] = bson.M{"$regex": insa, "$options": "i"}
	}
	if dorm := query.Get("dorm_number"); dorm != "" {
		filter["dorm_number"] = bson.M{"$regex": dorm, "$options": "i"}
	}

	// ===== Role-based filtering =====
	if userRole != "admin" {
		filter["role"] = "student" // normal users can only see other users
	}

	cursor, err := usersCol.Find(context.Background(), filter)
	if err != nil {
		http.Error(w, `{"error": "Failed to search users"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	type PublicUser struct {
		Name       string `json:"name"`
		ClassTag   string `json:"class_tag"`
		BooksRead  int    `json:"books_read"`
		RankScore  int    `json:"rank_score"`
		InsaBatch  string `json:"insa_batch,omitempty"`
		DormNumber string `json:"dorm_number,omitempty"`
	}

	var results []PublicUser
	for cursor.Next(context.Background()) {
		var u models.User
		if err := cursor.Decode(&u); err != nil {
			continue
		}

		publicUser := PublicUser{
			Name:      u.Name,
			ClassTag:  u.ClassTag,
			BooksRead: u.BooksRead,
			RankScore: u.RankScore,
		}

		// Admins see extra fields
		if userRole == "admin" {
			publicUser.InsaBatch = u.InsaBatch
			publicUser.DormNumber = u.DormNumber
		}

		results = append(results, publicUser)

	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"count": len(results),
		"users": results,
	})
}

func (h *SocialHandler) Analytics(w http.ResponseWriter, r *http.Request) {
	// Define error response structure
	type ErrorResponse struct {
		Error string `json:"error"`
	}

	// Define user response structure
	type UserResponse struct {
		Name      string `json:"name"`
		BooksRead int    `json:"books_read"`
		RankScore int    `json:"rank_score"`
		InsaBatch string `json:"insa_batch"`
	}

	// Define book response structure
	type BookResponse struct {
		Title  string `json:"title"`
		Author string `json:"author"`
		Genre  string `json:"genre"`
		Count  int64  `json:"count"` // Borrows or completions
	}

	// Define review response structure
	type ReviewResponse struct {
		BookTitle  string  `json:"book_title"`
		ReviewText string  `json:"review_text"`
		Upvotes    int     `json:"upvotes"`
		AIScore    float64 `json:"ai_score"`
	}

	// Define quote response structure
	type QuoteResponse struct {
		Text    string `json:"text"`
		Upvotes int    `json:"upvotes"`
	}

	// Define badge distribution structure
	type BadgeDistribution struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
	}

	// Define users analytics structure
	type UsersAnalytics struct {
		TotalUsers           int64          `json:"total_users"`
		PendingRegistrations int64          `json:"pending_registrations"`
		TopReadersByBooks    []UserResponse `json:"top_readers_by_books"`
		TopReadersByRank     []UserResponse `json:"top_readers_by_rank"`
	}

	// Define books analytics structure
	type BooksAnalytics struct {
		TotalBooks                int64          `json:"total_books"`
		PopularBooksByBorrows     []BookResponse `json:"popular_books_by_borrows"`
		PopularBooksByCompletions []BookResponse `json:"popular_books_by_completions"`
	}

	// Define reading analytics structure
	type ReadingAnalytics struct {
		AvgReadingTimeHours float64 `json:"avg_reading_time_hours"`
	}

	// Define social analytics structure
	type SocialAnalytics struct {
		TotalReviews        int64            `json:"total_reviews"`
		TotalQuotes         int64            `json:"total_quotes"`
		TotalReviewComments int64            `json:"total_review_comments"`
		TotalQuoteComments  int64            `json:"total_quote_comments"`
		TopReviews          []ReviewResponse `json:"top_reviews"`
		TopQuotes           []QuoteResponse  `json:"top_quotes"`
	}

	// Define badges analytics structure
	type BadgesAnalytics struct {
		TotalBadges       int64               `json:"total_badges"`
		BadgeDistribution []BadgeDistribution `json:"badge_distribution"`
	}

	// Define analytics response structure
	type AnalyticsResponse struct {
		Users       UsersAnalytics   `json:"users"`
		Books       BooksAnalytics   `json:"books"`
		Reading     ReadingAnalytics `json:"reading"`
		Social      SocialAnalytics  `json:"social"`
		Badges      BadgesAnalytics  `json:"badges"`
		GeneratedAt time.Time        `json:"generated_at"`
	}

	// Helper to send error response
	sendError := func(w http.ResponseWriter, status int, message string) {
		w.WriteHeader(status)
		if err := json.NewEncoder(w).Encode(ErrorResponse{Error: message}); err != nil {
			log.Printf("Failed to encode error response: %v", err)
		}
	}

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
	// Helper to get int64 pointer
	int64Ptr := func(i int64) *int64 {
		return &i
	}

	// Validate HTTP method
	if r.Method != http.MethodGet {
		sendError(w, http.StatusMethodNotAllowed, "Only GET requests are allowed")
		return
	}

	// Set response content type
	w.Header().Set("Content-Type", "application/json")

	// Parse limit query parameter (default 5, max 100)
	limit := int64(5)
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.ParseInt(limitStr, 10, 64); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		} else if err != nil {
			log.Printf("Invalid limit parameter: %v", err)
			sendError(w, http.StatusBadRequest, "Invalid limit parameter")
			return
		}
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Initialize collections
	usersCol := h.DB.Collection("users")
	pendingRegCol := h.DB.Collection("pending_registrations")
	booksCol := h.DB.Collection("books")
	borrowHistoryCol := h.DB.Collection("BorrowHistory")
	readingProgressCol := h.DB.Collection("ReadingProgress")
	reviewsCol := h.DB.Collection("Reviews")
	quotesCol := h.DB.Collection("quotes")
	reviewCommentsCol := h.DB.Collection("review_comments")
	quoteCommentsCol := h.DB.Collection("quote_comments")
	badgesCol := h.DB.Collection("Badges")

	// ===== Users Stats =====
	// Total users
	totalUsers, err := usersCol.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Printf("Failed to count users: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to count users")
		return
	}

	// Total pending registrations
	totalPending, err := pendingRegCol.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Printf("Failed to count pending registrations: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to count pending registrations")
		return
	}

	// Top readers by books read
	topReadersByBooksCursor, err := usersCol.Find(ctx, bson.M{"role": bson.M{"$ne": "admin"}}, &options.FindOptions{
		Sort:  bson.M{"books_read": -1},
		Limit: int64Ptr(limit),
	})
	if err != nil {
		log.Printf("Failed to fetch top readers by books: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch top readers by books")
		return
	}
	defer topReadersByBooksCursor.Close(ctx)

	var topReadersByBooks []UserResponse
	for topReadersByBooksCursor.Next(ctx) {
		var user models.User
		if err := topReadersByBooksCursor.Decode(&user); err != nil {
			log.Printf("Failed to decode user for top readers by books: %v", err)
			sendError(w, http.StatusInternalServerError, "Failed to decode top readers by books")
			return
		}
		topReadersByBooks = append(topReadersByBooks, UserResponse{
			Name:      user.Name,
			BooksRead: user.BooksRead,
			RankScore: user.RankScore,
			InsaBatch: user.InsaBatch,
		})
	}
	if err := topReadersByBooksCursor.Err(); err != nil {
		log.Printf("Cursor error for top readers by books: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch top readers by books")
		return
	}

	// Top readers by rank score
	topReadersByRankCursor, err := usersCol.Find(ctx, bson.M{"role": bson.M{"$ne": "admin"}}, &options.FindOptions{
		Sort:  bson.M{"rank_score": -1},
		Limit: int64Ptr(limit),
	})
	if err != nil {
		log.Printf("Failed to fetch top readers by rank: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch top readers by rank")
		return
	}
	defer topReadersByRankCursor.Close(ctx)

	var topReadersByRank []UserResponse
	for topReadersByRankCursor.Next(ctx) {
		var user models.User
		if err := topReadersByRankCursor.Decode(&user); err != nil {
			log.Printf("Failed to decode user for top readers by rank: %v", err)
			sendError(w, http.StatusInternalServerError, "Failed to decode top readers by rank")
			return
		}
		topReadersByRank = append(topReadersByRank, UserResponse{
			Name:      user.Name,
			BooksRead: user.BooksRead,
			RankScore: user.RankScore,
			InsaBatch: user.InsaBatch,
		})
	}
	if err := topReadersByRankCursor.Err(); err != nil {
		log.Printf("Cursor error for top readers by rank: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch top readers by rank")
		return
	}

	// ===== Books Stats =====
	// Total books
	totalBooks, err := booksCol.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Printf("Failed to count books: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to count books")
		return
	}

	// Popular books by borrows (from BorrowHistory)
	borrowsPipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$book_id"},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
		{{Key: "$limit", Value: limit}},
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "books"},
			{Key: "localField", Value: "_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "book"},
		}}},
		{{Key: "$unwind", Value: bson.D{{Key: "path", Value: "$book"}, {Key: "preserveNullAndEmptyArrays", Value: true}}}},
	}
	borrowsCursor, err := borrowHistoryCol.Aggregate(ctx, borrowsPipeline)
	if err != nil {
		log.Printf("Failed to fetch popular books by borrows: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch popular books by borrows")
		return
	}
	defer borrowsCursor.Close(ctx)

	var popularBooksByBorrows []struct {
		BookID primitive.ObjectID `bson:"_id"`
		Count  int64              `bson:"count"`
		Book   models.Book        `bson:"book"`
	}
	if err := borrowsCursor.All(ctx, &popularBooksByBorrows); err != nil {
		log.Printf("Failed to decode popular books by borrows: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to decode popular books by borrows")
		return
	}

	bookBorrowsResponses := make([]BookResponse, 0, len(popularBooksByBorrows))
	for _, b := range popularBooksByBorrows {
		bookBorrowsResponses = append(bookBorrowsResponses, BookResponse{
			Title:  b.Book.Title,
			Author: b.Book.Author,
			Genre:  b.Book.Genre,
			Count:  b.Count,
		})
	}

	// Popular books by completions (from ReadingProgress)
	completionsPipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: "completed", Value: true}}}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$book_id"},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
		{{Key: "$limit", Value: limit}},
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "books"},
			{Key: "localField", Value: "_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "book"},
		}}},
		{{Key: "$unwind", Value: bson.D{{Key: "path", Value: "$book"}, {Key: "preserveNullAndEmptyArrays", Value: true}}}},
	}
	completionsCursor, err := readingProgressCol.Aggregate(ctx, completionsPipeline)
	if err != nil {
		log.Printf("Failed to fetch popular books by completions: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch popular books by completions")
		return
	}
	defer completionsCursor.Close(ctx)

	var popularBooksByCompletions []struct {
		BookID primitive.ObjectID `bson:"_id"`
		Count  int64              `bson:"count"`
		Book   models.Book        `bson:"book"`
	}
	if err := completionsCursor.All(ctx, &popularBooksByCompletions); err != nil {
		log.Printf("Failed to decode popular books by completions: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to decode popular books by completions")
		return
	}

	bookCompletionsResponses := make([]BookResponse, 0, len(popularBooksByCompletions))
	for _, b := range popularBooksByCompletions {
		bookCompletionsResponses = append(bookCompletionsResponses, BookResponse{
			Title:  b.Book.Title,
			Author: b.Book.Author,
			Genre:  b.Book.Genre,
			Count:  b.Count,
		})
	}

	// ===== Reading Stats =====
	avgReadingPipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: "completed", Value: true}}}},
		{{Key: "$project", Value: bson.D{
			{Key: "readingTime", Value: bson.D{
				{Key: "$divide", Value: []interface{}{
					bson.D{{Key: "$subtract", Value: []interface{}{"$finished_reading", "$started_at"}}},
					1000 * 60 * 60, // milliseconds -> hours
				}},
			}},
		}}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: nil},
			{Key: "avgTimeHours", Value: bson.D{{Key: "$avg", Value: "$readingTime"}}},
		}}},
	}
	avgCursor, err := readingProgressCol.Aggregate(ctx, avgReadingPipeline)
	if err != nil {
		log.Printf("Failed to calculate average reading time: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to calculate average reading time")
		return
	}
	defer avgCursor.Close(ctx)

	var avgRes []struct {
		AvgTimeHours float64 `bson:"avgTimeHours"`
	}
	if err := avgCursor.All(ctx, &avgRes); err != nil {
		log.Printf("Failed to decode average reading time: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to decode average reading time")
		return
	}
	avgReadingTime := 0.0
	if len(avgRes) > 0 {
		avgReadingTime = avgRes[0].AvgTimeHours
	}

	// ===== Social Stats =====
	// Total reviews
	totalReviews, err := reviewsCol.CountDocuments(ctx, bson.M{"posted": true})
	if err != nil {
		log.Printf("Failed to count reviews: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to count reviews")
		return
	}

	// Total quotes
	totalQuotes, err := quotesCol.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Printf("Failed to count quotes: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to count quotes")
		return
	}

	// Total review comments
	totalReviewComments, err := reviewCommentsCol.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Printf("Failed to count review comments: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to count review comments")
		return
	}

	// Total quote comments
	totalQuoteComments, err := quoteCommentsCol.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Printf("Failed to count quote comments: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to count quote comments")
		return
	}

	// Top reviews by upvotes with book title
	reviewsPipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: "posted", Value: true}}}},
		{{Key: "$sort", Value: bson.D{{Key: "upvotes", Value: -1}}}},
		{{Key: "$limit", Value: limit}},
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "books"},
			{Key: "localField", Value: "book_id"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "book"},
		}}},
		{{Key: "$unwind", Value: bson.D{{Key: "path", Value: "$book"}, {Key: "preserveNullAndEmptyArrays", Value: true}}}},
	}
	topReviewsCursor, err := reviewsCol.Aggregate(ctx, reviewsPipeline)
	if err != nil {
		log.Printf("Failed to fetch top reviews: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch top reviews")
		return
	}
	defer topReviewsCursor.Close(ctx)

	var topReviews []struct {
		ReviewText string      `bson:"review_text"`
		AIScore    float64     `bson:"ai_score"`
		Upvotes    int         `bson:"upvotes"`
		Book       models.Book `bson:"book"`
	}
	if err := topReviewsCursor.All(ctx, &topReviews); err != nil {
		log.Printf("Failed to decode top reviews: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to decode top reviews")
		return
	}

	reviewResponses := make([]ReviewResponse, 0, len(topReviews))
	for _, r := range topReviews {
		bookTitle := "Unknown"
		if r.Book.ID != primitive.NilObjectID {
			bookTitle = r.Book.Title
		}
		reviewResponses = append(reviewResponses, ReviewResponse{
			BookTitle:  bookTitle,
			ReviewText: r.ReviewText,
			AIScore:    r.AIScore,
			Upvotes:    r.Upvotes,
		})
	}

	// Top quotes by upvotes
	topQuotesCursor, err := quotesCol.Find(ctx, bson.M{}, &options.FindOptions{
		Sort:  bson.M{"upvotes": -1},
		Limit: int64Ptr(limit),
	})
	if err != nil {
		log.Printf("Failed to fetch top quotes: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch top quotes")
		return
	}
	defer topQuotesCursor.Close(ctx)

	var topQuotes []QuoteResponse
	for topQuotesCursor.Next(ctx) {
		var quote models.Quote
		if err := topQuotesCursor.Decode(&quote); err != nil {
			log.Printf("Failed to decode quote: %v", err)
			sendError(w, http.StatusInternalServerError, "Failed to decode top quotes")
			return
		}
		topQuotes = append(topQuotes, QuoteResponse{
			Text:    quote.Text,
			Upvotes: quote.Upvotes,
		})
	}
	if err := topQuotesCursor.Err(); err != nil {
		log.Printf("Cursor error for top quotes: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch top quotes")
		return
	}

	// ===== Badges Stats =====
	// Total badges
	totalBadges, err := badgesCol.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Printf("Failed to count badges: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to count badges")
		return
	}

	// Badge distribution by type
	badgePipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$type"},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
	}
	badgeCursor, err := badgesCol.Aggregate(ctx, badgePipeline)
	if err != nil {
		log.Printf("Failed to fetch badge distribution: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to fetch badge distribution")
		return
	}
	defer badgeCursor.Close(ctx)

	var badgeDistribution []BadgeDistribution
	if err := badgeCursor.All(ctx, &badgeDistribution); err != nil {
		log.Printf("Failed to decode badge distribution: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to decode badge distribution")
		return
	}

	// ===== Return analytics =====
	response := AnalyticsResponse{
		Users: UsersAnalytics{
			TotalUsers:           totalUsers,
			PendingRegistrations: totalPending,
			TopReadersByBooks:    topReadersByBooks,
			TopReadersByRank:     topReadersByRank,
		},
		Books: BooksAnalytics{
			TotalBooks:                totalBooks,
			PopularBooksByBorrows:     bookBorrowsResponses,
			PopularBooksByCompletions: bookCompletionsResponses,
		},
		Reading: ReadingAnalytics{
			AvgReadingTimeHours: avgReadingTime,
		},
		Social: SocialAnalytics{
			TotalReviews:        totalReviews,
			TotalQuotes:         totalQuotes,
			TotalReviewComments: totalReviewComments,
			TotalQuoteComments:  totalQuoteComments,
			TopReviews:          reviewResponses,
			TopQuotes:           topQuotes,
		},
		Badges: BadgesAnalytics{
			TotalBadges:       totalBadges,
			BadgeDistribution: badgeDistribution,
		},
		GeneratedAt: time.Now(),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to encode response")
		return
	}
}

// GetReviewComments fetches all comments for a given review
func (h *SocialHandler) GetReviewComments(w http.ResponseWriter, r *http.Request) {
	reviewIDStr := r.URL.Query().Get("reviewId")
	if reviewIDStr == "" {
		http.Error(w, `{"error": "Missing reviewId"}`, http.StatusBadRequest)
		return
	}
	reviewID, err := primitive.ObjectIDFromHex(reviewIDStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid reviewId"}`, http.StatusBadRequest)
		return
	}
	commentsCol := h.DB.Collection("ReviewComments")
	cursor, err := commentsCol.Find(r.Context(), bson.M{"review_id": reviewID}, &options.FindOptions{
		Sort: bson.M{"created_at": 1},
	})
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch comments"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())
	var comments []bson.M
	if err := cursor.All(r.Context(), &comments); err != nil {
		http.Error(w, `{"error": "Failed to decode comments"}`, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{"comments": comments})
}

// GetQuoteComments fetches all comments for a given quote
func (h *SocialHandler) GetQuoteComments(w http.ResponseWriter, r *http.Request) {
	quoteIDStr := r.URL.Query().Get("quoteId")
	if quoteIDStr == "" {
		http.Error(w, `{"error": "Missing quoteId"}`, http.StatusBadRequest)
		return
	}
	quoteID, err := primitive.ObjectIDFromHex(quoteIDStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid quoteId"}`, http.StatusBadRequest)
		return
	}
	commentsCol := h.DB.Collection("QuoteComments")
	cursor, err := commentsCol.Find(r.Context(), bson.M{"quote_id": quoteID}, &options.FindOptions{
		Sort: bson.M{"created_at": 1},
	})
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch comments"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())
	var comments []bson.M
	if err := cursor.All(r.Context(), &comments); err != nil {
		http.Error(w, `{"error": "Failed to decode comments"}`, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{"comments": comments})
}

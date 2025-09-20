package handlers

import (
	"context"
	"encoding/json"

	"log"
	"net/http"
	"os"
	"reading-tracker/backend/helpers"
	"reading-tracker/backend/models"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"fmt"
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
		ISBN       string    `json:"isbn"`
		ReaderID   string    `json:"reader_id"`
		ReviewText string    `json:"review_text"`
		Upvotes    int       `json:"upvotes"`
		CreatedAt  time.Time `json:"created_at"`
	}

	var results []ReviewResponse
	for cursor.Next(context.Background()) {
		var rev models.Review
		if err := cursor.Decode(&rev); err != nil {
			http.Error(w, `{"error": "Failed to decode review"}`, http.StatusInternalServerError)
			return
		}
		results = append(results, ReviewResponse{
			ISBN:       isbn,
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
		ID     primitive.ObjectID `bson:"_id"`
		UserID primitive.ObjectID `bson:"user_id"`
		Upvotes int               `bson:"upvotes"`
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
			Badges:     userBadges[user.ID], // attach badges
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

	userID, err := primitive.ObjectIDFromHex(claims["user_id"].(string))
	if err != nil {
		http.Error(w, `{"error": "Invalid user ID"}`, http.StatusBadRequest)
		return
	}

	// ===== Fetch User Data =====
	usersCol := h.DB.Collection("users")
	var user models.User
	err = usersCol.FindOne(context.Background(), bson.M{"_id": userID, "verified": true}).Decode(&user)
	if err != nil {
		http.Error(w, `{"error": "User not found or not verified"}`, http.StatusNotFound)
		return
	}

	// ===== Fetch Reading Progress =====
	progressCol := h.DB.Collection("ReadingProgress")
	cursor, err := progressCol.Find(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch reading progress"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var readingHistory []map[string]interface{}
	for cursor.Next(context.Background()) {
		var progress models.ReadingProgress
		if err := cursor.Decode(&progress); err != nil {
			continue
		}

		readingHistory = append(readingHistory, map[string]interface{}{
			"book_title":  progress.BookTitle,
			"pages_read":  progress.PagesRead,
			"total_pages": progress.TotalPages,
			"completed":   progress.Completed,
			"reflection":  progress.Reflection,
			"started_at":  progress.StartedReading,
			"finished_at": progress.FinishedReading,
			"streak_days": progress.StreakDays,
		})
	}

	// ===== Fetch Badges =====
	badgesCol := h.DB.Collection("Badges")
	badgeCursor, err := badgesCol.Find(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch badges"}`, http.StatusInternalServerError)
		return
	}
	defer badgeCursor.Close(context.Background())

	var badges []map[string]interface{}
	for badgeCursor.Next(context.Background()) {
		var badge map[string]interface{}
		if err := badgeCursor.Decode(&badge); err != nil {
			continue
		}
		badges = append(badges, badge)
	}
	// ===== Calculate current streak =====
	currentStreak := 0
	if len(readingHistory) > 0 {
		// find the latest progress by LastUpdated
		latest := readingHistory[0]
		for _, progress := range readingHistory {
			if t1, ok1 := progress["last_updated"].(time.Time); ok1 {
				if t0, ok0 := latest["last_updated"].(time.Time); ok0 {
					if t1.After(t0) {
						latest = progress
					}
				}
			}
		}
		if streak, ok := latest["streak_days"].(int); ok {
			currentStreak = streak
		}
	}

	// ===== Construct Profile =====
	profile := map[string]any{
		"name":             user.Name,
		"reader_id":        user.ReaderID,
		"email":            user.Email,
		"class_tag":        user.ClassTag,
		"books_read":       user.BooksRead,
		"rank_score":       user.RankScore,
		"current_streak":   currentStreak,
		"reading_progress": readingHistory,
		"badges":           badges,
	}

	// Return JSON response
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
		"user_id":  userID,
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
		"count":          len(recommendations),
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
        "message": "Quote added successfully",
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

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": message,
		"upvotes": comment.Upvotes,
	})
}

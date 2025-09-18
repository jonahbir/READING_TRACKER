package handlers

import (
	"context"
	"encoding/json"

	"net/http"
	"os"
	"reading-tracker/backend/models"
	"strconv"
	"time"

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

	// ===== Check if user already upvoted =====
	var review models.Review
	err = reviewsCol.FindOne(context.Background(), bson.M{"_id": reviewID, "book_deleted": false}).Decode(&review)
	if err != nil {
		http.Error(w, `{"error": "Review not found"}`, http.StatusNotFound)
		return
	}

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

	if alreadyLiked {
		// Remove like
		update = bson.M{
			"$inc":  bson.M{"upvotes": -1},
			"$pull": bson.M{"upvoted_by": userID},
		}
		message = "Review unliked successfully"
	} else {
		// Add like
		update = bson.M{
			"$inc":      bson.M{"upvotes": 1},
			"$addToSet": bson.M{"upvoted_by": userID},
		}
		message = "Review liked successfully"
	}

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
		http.Error(w, `{"error": "Failed to update review"}`, http.StatusInternalServerError)
		return
	}

	// ===== Return updated review =====
	err = reviewsCol.FindOne(context.Background(), bson.M{"_id": reviewID, "book_deleted": false}).Decode(&review)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch updated review"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"message": message,
		"upvotes": review.Upvotes,
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

	var leaderboard []LeaderboardUser
	for cursor.Next(context.Background()) {
		var user models.User
		if err := cursor.Decode(&user); err != nil {
			continue
		}
		leaderboard = append(leaderboard, LeaderboardUser{
			Name:      user.Name,
			ReaderID:  user.ReaderID,
			RankScore: user.RankScore,
			BooksRead: user.BooksRead,
			ClassTag:  user.ClassTag,
			Badges:    nil, // If you implement a separate Badges collection, fetch here
		})
	}

	// Return leaderboard
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"leaderboard": leaderboard,
		"count":       len(leaderboard),
	})
}

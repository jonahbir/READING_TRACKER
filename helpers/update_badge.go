package helpers

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"reading-tracker/backend/models" // replace with your actual import path
)

// Badge definitions
var achievementBadges = []struct {
	Name       string
	Score      int
	CriteriaFn func(user models.User, db *mongo.Database) bool
}{
	{"Book Worm", 3, func(u models.User, db *mongo.Database) bool { return u.BooksRead >= 4 }},
	{"Marathon Reader", 5, func(u models.User, db *mongo.Database) bool { return u.BooksRead >= 8 }},
	{"Page Turner", 2, func(u models.User, db *mongo.Database) bool { return u.BooksRead >= 5 }},
	{"Streak Keeper", 4, func(u models.User, db *mongo.Database) bool {
		progress := db.Collection("ReadingProgress")
		count, _ := progress.CountDocuments(context.Background(), bson.M{"user_id": u.ID, "streak_days": bson.M{"$gte": 7}})
		return count > 0
	}},
	{"Upvoted Author", 3, func(u models.User, db *mongo.Database) bool {
		reviews := db.Collection("Reviews")
		count, _ := reviews.CountDocuments(context.Background(), bson.M{"user_id": u.ID, "upvotes": bson.M{"$gte": 5}})
		return count > 0
	}},
	{"Community Helper", 3, func(u models.User, db *mongo.Database) bool {
		reviews := db.Collection("Reviews")
		count, _ := reviews.CountDocuments(context.Background(), bson.M{"user_id": u.ID, "upvotes": bson.M{"$gte": 1}})
		return count >= 3
	}},
	{"Daily Reader", 2, func(u models.User, db *mongo.Database) bool {
		progress := db.Collection("ReadingProgress")
		count, _ := progress.CountDocuments(context.Background(), bson.M{"user_id": u.ID, "last_updated": bson.M{"$gte": time.Now().Add(-24 * time.Hour)}})
		return count > 0
	}},
	{"Quote Contributor", 3, func(u models.User, db *mongo.Database) bool {
		quotes := db.Collection("Quotes")
		count, _ := quotes.CountDocuments(context.Background(), bson.M{"user_id": u.ID})
		return count > 0
	}},
	{"Popular Quote", 5, func(u models.User, db *mongo.Database) bool {
		quotes := db.Collection("Quotes")
		count, _ := quotes.CountDocuments(context.Background(), bson.M{"user_id": u.ID, "upvotes": bson.M{"$gte": 10}})
		return count > 0
	}},
}

// ClassTag thresholds based on time spent on platform
func determineClassTag(user models.User) string {
	now := time.Now()
	duration := now.Sub(user.CreatedAt)

	switch {
	case duration < 30*24*time.Hour: // less than 1 month
		return "Beginner"
	case duration < 3*30*24*time.Hour: // 1-3 months
		return "Casual"
	case duration < 10*30*24*time.Hour: // 3-10 months
		return "Regular"
	case duration < 12*30*24*time.Hour: // 10-12 months
		return "Dedicated"
	default: // >= 1 year
		return "Family"
	}
}

// UpdateUserBadgesAndClassTag updates badges, class-tag, and rank score automatically
func UpdateUserBadgesAndClassTag(userID primitive.ObjectID, db *mongo.Database) error {
	usersCol := db.Collection("users")
	badgesCol := db.Collection("Badges")

	var user models.User
	err := usersCol.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		return err
	}

	totalScore := 0

	// Process each badge
	for _, badgeDef := range achievementBadges {
		// Check if user already has badge
		count, _ := badgesCol.CountDocuments(context.Background(), bson.M{"user_id": user.ID, "name": badgeDef.Name})
		if count > 0 {
			totalScore += badgeDef.Score
			continue
		}

		// Evaluate criteria
		if badgeDef.CriteriaFn(user, db) {
			_, _ = badgesCol.InsertOne(context.Background(), bson.M{
				"user_id":     user.ID,
				"name":        badgeDef.Name,
				"type":        "achievement",
				"description": "Earned the " + badgeDef.Name + " badge!",
				"created_at":  time.Now(),
			})
			totalScore += badgeDef.Score
		}
	}

	classTag := determineClassTag(user)
	// update badge for class-tag type
	count, _ := badgesCol.CountDocuments(context.Background(), bson.M{"user_id": user.ID, "name": classTag})
	if count > 0 {
		_, _ = badgesCol.InsertOne(context.Background(), bson.M{
			"user_id":     user.ID,
			"name":        classTag,
			"type":        "class-Tag",
			"description": "Earned the " + classTag + " badge!",
			"created_at":  time.Now(),
		})
	}

	// Update rank score
	UpdateRankScore(db, user.ID, totalScore) // Adjust rank score
	// Update ClassTag

	// Update user document
	_, err = usersCol.UpdateOne(context.Background(), bson.M{"_id": user.ID}, bson.M{
		"$set": bson.M{
			"class_tag": classTag,
		},
	})
	return err
}

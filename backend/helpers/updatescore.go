
package helpers


import (
    "context"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func UpdateRankScore(db *mongo.Database, userID primitive.ObjectID, delta int) error {
	usersCol := db.Collection("users")

	_, err := usersCol.UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$inc": bson.M{"rank_score": delta}},
	)
	return err
}

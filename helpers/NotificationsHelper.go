package helpers

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"reading-tracker/backend/models"
)



// CreateNotification inserts a new notification
func CreateNotification(db *mongo.Database, userID, actorID, targetID primitive.ObjectID, notifType string) error {
	if userID == actorID {
		// Don't notify if someone acted on their own stuff
		return nil
	}

	notificationsCol := db.Collection("Notifications")

	Notification := models.Notification{
		UserID:    userID,
		ActorID:   actorID,
		Type:      notifType,
		TargetID:  targetID,
		Seen:      false,
		CreatedAt: time.Now(),
	}

	_, err := notificationsCol.InsertOne(context.Background(), Notification)
	return err
}

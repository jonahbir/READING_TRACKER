package models


import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
    ID                primitive.ObjectID `bson:"_id,omitempty"`
    Email             string             `bson:"email"`
    Password          string             `bson:"password"`
    Name              string             `bson:"name"`
    Role              string             `bson:"role"`
    StudentID         string             `bson:"student_id"`
    InsaBatch         string             `bson:"insa_batch"`
    DormNumber        string             `bson:"dorm_number"`
    EducationalStatus string             `bson:"educational_status"`
    Verified          bool               `bson:"verified"`
    BooksRead         int                `bson:"books_read"`
    RankScore         int                `bson:"rank_score"`
    ClassTag          string             `bson:"class_tag"`
    CreatedAt         time.Time          `bson:"created_at"`
}

type PendingRegistration struct {
    ID                primitive.ObjectID `bson:"_id,omitempty"`
    Email             string             `bson:"email"`
    Name              string             `bson:"name"`
    StudentID         string             `bson:"student_id"`
    InsaBatch         string             `bson:"insa_batch"`
    DormNumber        string             `bson:"dorm_number"`
    EducationalStatus string             `bson:"educational_status"`
    SubmittedAt       time.Time          `bson:"submitted_at"`
}
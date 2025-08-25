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
    Password          string             `bson:"password"`
    Name              string             `bson:"name"`
    StudentID         string             `bson:"student_id"`
    InsaBatch         string             `bson:"insa_batch"`
    DormNumber        string             `bson:"dorm_number"`
    EducationalStatus string             `bson:"educational_status"`
    SubmittedAt       time.Time          `bson:"submitted_at"`
}

type Book struct {
    ID              primitive.ObjectID `bson:"_id,omitempty"`
    Title           string             `bson:"title"`
    Author          string             `bson:"author"`
    ISBN            string             `bson:"isbn"`
    Type            string             `bson:"type"` // "hardcopy" or "softcopy"
    PhysicalLocation string            `bson:"physical_location"`
    SoftcopyURL     string            `bson:"softcopy_url"`
    Available       bool              `bson:"available"`
    BorrowedBy      primitive.ObjectID `bson:"borrowed_by,omitempty"`
    AddedBy         primitive.ObjectID `bson:"added_by,omitempty"`
    CreatedAt       time.Time          `bson:"created_at"`
}

type BorrowHistory struct {
    ID         primitive.ObjectID `bson:"_id,omitempty"`
    UserID     primitive.ObjectID `bson:"user_id"`
    BookID     primitive.ObjectID `bson:"book_id"`
    BorrowDate time.Time          `bson:"borrow_date"`
    ReturnDate time.Time          `bson:"return_date,omitempty"`
    Type       string             `bson:"type"` // "hardcopy" or "softcopy"
}

type ReadingProgress struct {
    ID              primitive.ObjectID `bson:"_id,omitempty"`
    UserID          primitive.ObjectID `bson:"user_id"`
    BookID          primitive.ObjectID `bson:"book_id"`
    PagesRead       int                `bson:"pages_read"`
    TotalPages      int                `bson:"total_pages"`
    Reflection      string             `bson:"reflection"`
    StreakDays      int                `bson:"streak_days"`
    BorrowHistoryID primitive.ObjectID `bson:"borrow_history_id"`
    Completed       bool               `bson:"completed"`
    LastUpdated     time.Time          `bson:"last_updated"`
}

type Review struct {
    ID            primitive.ObjectID `bson:"_id,omitempty"`
    BookID        primitive.ObjectID `bson:"book_id"`
    UserID        primitive.ObjectID `bson:"user_id"`
    ReviewText    string             `bson:"review_text"`
    AICheckStatus string             `bson:"ai_check_status"` // "pending", "approved", "rejected"
    AIScore       float64            `bson:"ai_score"`
    Posted        bool               `bson:"posted"`
    Upvotes       int                `bson:"upvotes"`
    CreatedAt     time.Time          `bson:"created_at"`
}
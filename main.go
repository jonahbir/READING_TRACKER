package main

import (
    "context"
    "log"
    "net/http"
    "os"

    "github.com/gorilla/mux"
    "github.com/joho/godotenv"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
    "reading-tracker/backend/handlers"
)

func main() {
    if err := godotenv.Load(); err != nil {
        log.Fatalf("Error loading .env file: %v", err)
    }

    mongoURI := os.Getenv("MONGO_URI")
    client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
    if err != nil {
        log.Fatalf("MongoDB connection failed: %v", err)
    }
    defer client.Disconnect(context.Background())

    if err := client.Ping(context.Background(), nil); err != nil {
        log.Fatalf("MongoDB ping failed: %v", err)
    }
    log.Println("Connected to MongoDB!")

    db := client.Database(os.Getenv("DB_NAME"))
    authHandler := &handlers.AuthHandler{DB: db}
    bookHandler := &handlers.BookHandler{DB: db}

    router := mux.NewRouter()
    router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Reading Tracker Backend is running!"))
    })
    router.HandleFunc("/register", authHandler.Register).Methods("POST")
    router.HandleFunc("/login", authHandler.Login).Methods("POST")
    router.HandleFunc("/approve-user", authHandler.ApproveUser).Methods("POST")
    router.HandleFunc("/add-book", bookHandler.AddBook).Methods("POST")
    router.HandleFunc("/books", bookHandler.ListBooks).Methods("GET")
    router.HandleFunc("/borrow-book", bookHandler.BorrowBook).Methods("POST")
    router.HandleFunc("/return-book", bookHandler.ReturnBook).Methods("POST")

    port := os.Getenv("PORT")
    log.Printf("Server starting on :%s...", port)
    if err := http.ListenAndServe(":"+port, router); err != nil {
        log.Fatalf("Server failed: %v", err)
    }
}
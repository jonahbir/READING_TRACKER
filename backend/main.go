package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"

    "github.com/gorilla/mux"
    "github.com/joho/godotenv"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Fatalf("Error loading .env file: %v", err)
    }

    // Connect to MongoDB
    mongoURI := os.Getenv("MONGO_URI")
    client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
    if err != nil {
        log.Fatalf("MongoDB connection failed: %v", err)
    }
    defer client.Disconnect(context.Background())

    // Test MongoDB connection
    if err := client.Ping(context.Background(), nil); err != nil {
        log.Fatalf("MongoDB ping failed: %v", err)
    }
    log.Println("Connected to MongoDB!")

    // Set up router
    router := mux.NewRouter()
    router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Reading Tracker Backend is running!")
    })

    port := os.Getenv("PORT")
    log.Printf("Server starting on :%s...", port)
    if err := http.ListenAndServe(":"+port, router); err != nil {
        log.Fatalf("Server failed: %v", err)
    }
}
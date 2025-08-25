package main

// Importing all the packages (tools) we need in this program
// Each package provides specific functionality.
import (
    "context"                     // Helps us control operations like database queries and cancel them if needed.
    "log"                         // Used for printing errors and information messages in the console.
    "net/http"                    // Allows us to build a web server and handle requests from users (like visiting a website).
    "os"                          // Lets us read environment variables (values stored outside of the code, like passwords or configuration).

    "github.com/gorilla/mux"      // A third-party package (not built-in) used to create and manage routes (URLs) in our server easily.
    "github.com/joho/godotenv"    // A package to load variables from a .env file (like secrets and database connections).
    "go.mongodb.org/mongo-driver/mongo"        // Official MongoDB driver to connect and work with MongoDB database.
    "go.mongodb.org/mongo-driver/mongo/options" // Provides extra options/settings for MongoDB connection.
    "reading-tracker/backend/handlers"         // Our own code package where we wrote "handlers" (functions that handle requests).
)

func main() {
    // STEP 1: Load environment variables from .env file
    // The .env file usually stores sensitive information like database URI and port.
    if err := godotenv.Load(); err != nil {
        log.Fatalf("Error loading .env file: %v", err)
    }

    // STEP 2: Connect to MongoDB database
    // First, get the MongoDB connection string from the environment variable "MONGO_URI".
    mongoURI := os.Getenv("MONGO_URI")

    // Use the connection string to connect to MongoDB.
    client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
    if err != nil {
        log.Fatalf("MongoDB connection failed: %v", err)
    }

    // Make sure to disconnect from MongoDB when the program stops running.
    defer client.Disconnect(context.Background())

    // STEP 3: Test the database connection by sending a "ping".
    // If the database responds, it means connection is successful.
    if err := client.Ping(context.Background(), nil); err != nil {
        log.Fatalf("MongoDB ping failed: %v", err)
    }
    log.Println("Connected to MongoDB!")

    // STEP 4: Select the database we want to use.
    // The database name is stored in the environment variable "DB_NAME".
    db := client.Database(os.Getenv("DB_NAME"))

    // STEP 5: Create handler objects for authentication and book operations.
    // These handlers contain functions to manage things like register, login, add book, etc.
    authHandler := &handlers.AuthHandler{DB: db}
    bookHandler := &handlers.BookHandler{DB: db}

    // STEP 6: Create a new router using Gorilla Mux.
    // A router decides what to do when a user visits a certain URL.
    router := mux.NewRouter()

    // Define all the routes (URLs) and link them to the right handler functions.
    // Each route says:
    // "When someone visits this URL with this method (GET/POST), run this function."

    // Default route to check if the server is working.
    router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Reading Tracker Backend is running!"))
    })

    // Authentication-related routes
    router.HandleFunc("/register", authHandler.Register).Methods("POST")     // Register a new user
    router.HandleFunc("/login", authHandler.Login).Methods("POST")           // User login
    router.HandleFunc("/approve-user", authHandler.ApproveUser).Methods("POST") // Approve a registered user

    // Book-related routes
    router.HandleFunc("/add-book", bookHandler.AddBook).Methods("POST")             // Add a new book
    router.HandleFunc("/books", bookHandler.ListBooks).Methods("GET")               // Get list of all books
    router.HandleFunc("/borrow-book", bookHandler.BorrowBook).Methods("POST")       // Borrow a book
    router.HandleFunc("/return-book", bookHandler.ReturnBook).Methods("POST")       // Return a borrowed book
    router.HandleFunc("/reading-progress", bookHandler.UpdateReadingProgress).Methods("POST") // Update progress in a book
    router.HandleFunc("/submit-review", bookHandler.SubmitReview).Methods("POST")   // Submit a review for a book
    router.HandleFunc("/approve-review", bookHandler.ApproveReview).Methods("POST") // Approve a submitted review

    // STEP 7: Start the web server.
    // The server will run on the port number defined in the environment variable "PORT".
    port := os.Getenv("PORT")
    log.Printf("Server starting on :%s...", port)

    // Listen for incoming requests and use the router to handle them.
    // If the server fails to start, log the error and stop.
    if err := http.ListenAndServe(":"+port, router); err != nil {
        log.Fatalf("Server failed: %v", err)
    }
}

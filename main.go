
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "time"

    "github.com/gorilla/mux"
    "github.com/joho/godotenv"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

// the logic here is that,

// first we load the environment variables from the .env file using the godotenv.Load() function.
// then we check if we really fetched the environnment variables correctly if we didn't then we have to leave the program with error message
// and if we did then we proceed to connect to the mongodb dababase! 
// but first we have to fetch the mangodb URI (Uniform resource identifier) from the environement variables using os.Getenv("MONGO_URI")
// THEN WE try to connect to the mongodb database using mongo.connect(context.Background(),options.client().ApplyURI(MongoURI)
// we assign this connection on client variable
// if there is an error while connecting to the db we will log the error and exit the porgram on time
// then we defer the disconnection of the client to ensure that it will be closed when the main function exits 

// and then we ping the database to check if the connection is successful 

// if the connection is not successful we will lof the error and exit the program 
// if the connection is successful we will log a message saying that we are connected to the mongodeb database 


// after that we set up a router using the gorilla/mux package 

// we use router:=mux.Newrouter() to create a new router instance 
// after crating the router then we will define a simpe route that handles a Get request to the root path ("/").


// we will then fetch the port number from the environment varibale using os.Getenv("PORT")
// Aand then we will log a message saying that the server is starting on the specificed port 

// then finally we will start the server using http.ListenAndServe(":"+port,router)

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
    users := db.Collection("users")
    _, err = users.InsertOne(context.Background(), bson.M{
        "email":             "test@example1.com",
        "name":             "Test User",
        "role":             "student",
        "student_id":       "12345",
        "insa_batch":       "Batch 2023",
        "dorm_number":      "Dorm 101",
        "educational_status": "2nd year student at ASTU",
        "verified":         false,
        "books_read":       0,
        "rank_score":       0,
        "class_tag":        "beginner",
        "created_at":       time.Now(),
    })
    if err != nil {
        log.Fatalf("Failed to insert sample user: %v", err)
    }
    log.Println("Inserted sample user!")

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
// what is done so far ?
// 1 register 
// 2 login -both admin and user 
// 3 approve user
// 4 add book
// 5 books 
// 6 borrow books 
// 7 return book 
// 8 reading progress 
// 9 submit review 
// 10 approve review

// problems 
// the admin and users can't change their password and modify thier profile 
// the users are not reccomending book 
// the admin must approve it 
// the admin also must put some review of the book while reccomending a book! some kind of short review
// the others are about the rank and others! 
// remember the rank is some kind of complex process we will
//  count the upvotes and the number of books he read and the amount of days it take for the user to read and finish the book
// so stop adding the rank as the user read and finish new book 
// what if the book is softcopy are you addding the book into the list of books which are under reading 

//if it is 
// softcopy there will be nothing called as return and the book should always be avalible weather you read it or not




package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"reading-tracker/backend/handlers"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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

	// check this part works and also check how method instances work in python work before moving to this! maybe that is useful
	authHandler := &handlers.AuthHandler{DB: db}
	bookHandler := &handlers.BookHandler{DB: db}

	router := mux.NewRouter()

	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Reading Tracker Backend is running!"))
	})

	// Authentication-related routes
	router.HandleFunc("/register", authHandler.Register).Methods("POST")
	router.HandleFunc("/login", authHandler.Login).Methods("POST")
	router.HandleFunc("/approve-user", authHandler.ApproveUser).Methods("POST")
	// Book-related routes
	router.HandleFunc("/add-book", bookHandler.AddBook).Methods("POST")
	router.HandleFunc("/books",bookHandler.ListAllBooks).Methods("GET")
	router.HandleFunc("/available-books", bookHandler.ListavailableBooks).Methods("GET")
	router.HandleFunc("/borrow-book", bookHandler.BorrowBook).Methods("POST")
	router.HandleFunc("/return-book", bookHandler.ReturnBook).Methods("POST")
	router.HandleFunc("/reading-progress", bookHandler.UpdateReadingProgress).Methods("POST")
	router.HandleFunc("/submit-review", bookHandler.SubmitReview).Methods("POST")
	router.HandleFunc("/approve-review", bookHandler.ApproveReview).Methods("POST")

	port := os.Getenv("PORT")
	log.Printf("Server starting on :%s...", port)

	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}



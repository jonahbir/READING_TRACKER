


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
	socialHandler := &handlers.SocialHandler{DB: db}
	router := mux.NewRouter()

	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Reading Tracker Backend is running!"))
	})

	// Authentication-related routes
	router.HandleFunc("/register", authHandler.Register).Methods("POST")        // working
	router.HandleFunc("/login", authHandler.Login).Methods("POST")              //  working
	router.HandleFunc("/approve-user", authHandler.ApproveUser).Methods("POST") // working
	router.HandleFunc("/bootstrap-admin", authHandler.BootstrapAdmin).Methods("POST")  // working
	router.HandleFunc("/add-admin", authHandler.AddAdmin).Methods("POST")              //working 
	router.HandleFunc("/change-password", authHandler.ChangePassword).Methods("POST")  // working



	// Book-related routes
	router.HandleFunc("/add-book", bookHandler.AddBook).Methods("POST")                         // working this will enable the admin to add a book
	router.HandleFunc("/books", bookHandler.ListAllBooks).Methods("GET")                        // working  this will list all books avalailable + unavailable--- no authenticaion it works for ang body
	router.HandleFunc("/available-books", bookHandler.ListavailableBooks).Methods("GET")        // working this will enables us to see books avalailable soft copy+ hardcopy that are not borrowed
	router.HandleFunc("/borrow-book", bookHandler.BorrowBook).Methods("POST")                   // working--this will enable us to borrow hardware book--user
	router.HandleFunc("/return-book", bookHandler.ReturnBook).Methods("POST")                   // this will enable us to return a hardcopy  book. admin
	router.HandleFunc("/reading-progress", bookHandler.UpdateReadingProgress).Methods("POST")   // working-- this will add a book into a reading progress
	router.HandleFunc("/submit-review", bookHandler.SubmitReview).Methods("POST")               // working--this will enable the user to submit a review
	router.HandleFunc("/approve-review", bookHandler.ApproveReview).Methods("POST")             // working--this approves the reading progress admin previalige
	router.HandleFunc("/add-soft-to-reading", bookHandler.AddToReading).Methods("POST")         // working- this adds the softcopy book into reading list
	router.HandleFunc("/user-reading-progress", bookHandler.ShowReadingProgress).Methods("GET") // working this shows the reading progress of the user
	router.HandleFunc("/user-borrow-history", bookHandler.ShowBorrowHistory).Methods("GET")     // working this shows the borrow history of the user
	router.HandleFunc("/book-update", bookHandler.UpdateBook).Methods("POST")                   // working this will help the admin to update any info related to book
	router.HandleFunc("/book-update", bookHandler.UpdateBook).Methods("POST")                   // working this will help the admin to update any info related to book
	router.HandleFunc("/delete-book", bookHandler.DeleteBook).Methods("DELETE")                 // working this will help the admin to delete a book
	router.HandleFunc("/check-book-readers", bookHandler.CheckBookReaders).Methods("GET")       // working this will help the admin to see who are the readers of a particular book
	// Social features routes
	router.HandleFunc("/public-reviews", socialHandler.PublicReviews).Methods("GET")             // working this will help any user to see the public reviews. (has query param isbn)
	router.HandleFunc("/toggle-upvote", socialHandler.ToggleUpvote).Methods("POST")            			// working this will help any user to upvote or remove upvote from a review
	router.HandleFunc("/leader-board", socialHandler.Leaderboard).Methods("GET")           			// working this will show the leader board of the users.(has query param limit)-accessable to all
	router.HandleFunc("/user-profile", socialHandler.UserProfile).Methods("GET")           				// working this will show the profile of a user-accessable to all        
	router.HandleFunc("/recommendations", socialHandler.GetRecommendations).Methods("GET")    			// working this will give book recommendations based on the user's reading history
	router.HandleFunc("/post-comment-review", socialHandler.PostCommentReview).Methods("POST")        // working this will help any user to comment on a review     
	router.HandleFunc("/toggle-review-comment-upvote", socialHandler.ToggleCommentUpvoteReview).Methods("POST") // working this will help any user to upvote or remove upvote from a comment on a review
	router.HandleFunc("/add-quote", socialHandler.AddQuote).Methods("POST")                                    // working this will help any user to add a quote           
	router.HandleFunc("/toggle-quote-upvote", socialHandler.ToggleUpvoteQuote).Methods("POST")     // working this will help any user to upvote or remove upvote from a quote   
	router.HandleFunc("/post-comment-quote", socialHandler.AddCommentQuote).Methods("POST")	   // working this will help any user to comment on a quote		  
	router.HandleFunc("/toggle-comment-quote-upvote", socialHandler.ToggleCommentUpvoteQuote).Methods("POST")  // working this will help any user to upvote or remove upvote from a comment on a quote
	router.HandleFunc("/list-notifications", socialHandler.ListNotifications).Methods("GET") // working this will help any user to see their notifications      
	router.HandleFunc("/mark-notification-seen", socialHandler.MarkNotificationsSeen).Methods("POST") // working this will help any user to mark their notifications as seen
	router.HandleFunc("/search-books", bookHandler.SearchBooks).Methods("GET")  						// working this will help to search the book using different queries like genre title, author
	router.HandleFunc("/search-reviews", socialHandler.SearchReviews).Methods("GET")           // working this will help to search reviews using keywords 
	router.HandleFunc("/search-quotes", socialHandler.SearchQuotes).Methods("GET")             // working this will help to search quotes using keywords 
	router.HandleFunc("/search-users", socialHandler.SearchUsers).Methods("GET")          // working this will help to search users using keywords like name reader id insa batch dorm number educational status
	router.HandleFunc("/analytics", socialHandler.Analytics).Methods("GET")  							// working it will give total analysis of things for the admin ! 
	// Start the server
	port := os.Getenv("PORT")
	log.Printf("Server starting on :%s...", port)

	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

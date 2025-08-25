# Database Schema Design (Updated)

## Users
- _id: ObjectId
- email: String (unique)
- password: String (hashed)
- name: String
- role: String ("student", "admin")
- student_id: String
- verified: Boolean
- books_read: Number
- rank_score: Number
- class_tag: String
- created_at: ISODate

## PendingRegistrations
- _id: ObjectId
- email: String
- name: String
- student_id: String
- submitted_at: ISODate

## Books
- _id: ObjectId
- title: String
- author: String
- isbn: String (unique)
- type: String ("hardcopy", "softcopy")
- physical_location: String
- softcopy_url: String
- available: Boolean
- borrowed_by: ObjectId (Users)
- added_by: ObjectId (Users)
- created_at: ISODate

## ExternalBookCache
- _id: ObjectId
- isbn: String
- title: String
- author: String
- publisher: String
- published_date: String
- description: String
- cached_at: ISODate
- source: String

## BorrowHistory
- _id: ObjectId
- user_id: ObjectId (Users)
- book_id: ObjectId (Books)
- borrow_date: ISODate
- return_date: ISODate
- type: String

## ReadingProgress
- _id: ObjectId
- user_id: ObjectId (Users)
- book_id: ObjectId (Books)
- pages_read: Number
- total_pages: Number
- reflection: String
- streak_days: Number
- borrow_history_id: ObjectId (BorrowHistory)
- completed: Boolean
- last_updated: ISODate

## Reviews
- _id: ObjectId
- book_id: ObjectId (Books)
- user_id: ObjectId (Users)
- review_text: String
- ai_check_status: String ("pending", "approved", "rejected")
- ai_score: Number
- posted: Boolean
- upvotes: Number
- created_at: ISODate

## Badges
- _id: ObjectId
- user_id: ObjectId (Users)
- name: String
- description: String
- awarded_at: ISODate

## Quotes
- _id: ObjectId
- user_id: ObjectId (Users)
- book_id: ObjectId (Books)
- quote: String
- created_at: ISODate

## Recommendations
- _id: ObjectId
- user_id: ObjectId (Users)
- book_id: ObjectId (Books)
- reason: String
- verified: Boolean
- created_at: ISODate

## Indexes
- Users: { email: 1 } (unique), { student_id: 1 }
- Books: { isbn: 1 } (unique), { available: 1 }
- ReadingProgress: { user_id: 1, book_id: 1 }
- BorrowHistory: { user_id: 1, book_id: 1 }
- Reviews: { user_id: 1, book_id: 1 }, { posted: 1 }
- Badges: { user_id: 1 }
- Quotes: { user_id: 1, book_id: 1 }
- Recommendations: { user_id: 1, book_id: 1 }

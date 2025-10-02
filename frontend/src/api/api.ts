import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
// Base URL for your Go backend
const API_BASE_URL = 'http://localhost:8080'; // Update if different or using proxy

// Define response types based on your backend
interface LoginResponse {
  token: string;
}

interface BorrowResponse {
  location: string;
  phone_number: string;
}

interface ReturnResponse {
  message: string;
}

interface AddSoftResponse {
  message: string;
}

interface LeaderboardEntry {
  reader_id: string;
  name: string;
  rank_score: number;
  books_read: number;
  class_tag: string;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

interface Book {
  ID: string;
  Title: string;
  Author: string;
  ISBN: string;
  Genre: string;
  Type: string;
  PhysicalLocation: string;
  PhoneNumberOfTheHandler: string;
  SoftcopyURL: string;
  Available: boolean;
  BorrowedBy: string;
  AddedBy: string;
  CreatedAt: string;
  AboutTheBook: string;
  TotalPages: number;
}

interface BooksResponse {
  books?: Book[];
}

interface Review {
  id?: string;
  isbn: string;
  reader_id: string;
  review_text: string;
  upvotes: number;
  created_at: string;
  user_name?: string;
}

interface ReviewsResponse {
  reviews: Review[];
}

interface Quote {
  id: string;
  text: string;
  user_name: string;
  reader_id: string;
  upvotes: number;
  created_at: string;
}

interface QuotesResponse {
  count: number;
  quotes: Quote[];
}

interface UserProfile {
  name: string;
  reader_id: string;
  class_tag: string;
  rank_score: number;
  books_read: number;
  badges: string[];
  borrow_history: BorrowHistoryEntry[];
  email?: string;
  dorm_number?: string;
  insa_batch?: string;
  educational_status?: string;
}

interface BorrowHistoryEntry {
  book_title: string;
  borrow_date: string;
  return_date: string;
  returned: boolean;
}

interface ReadingProgressEntry {
  title: string;
  author: string;
  isbn: string;
  total_page: number;
  pages_read: number;
  start_date: string;
  competed_status: boolean;
  reflection: string;
  completed_date: string;
  streak_days: number;
  last_updated: string;
}

interface ReadingProgressResponse {
  "your reading progress": ReadingProgressEntry[];
}

interface Notification {
  user_id: string;
  actor_id: string;
  target_id: string;
  type: string;
  seen: boolean;
  created_at: string;
}

interface NotificationsResponse {
  count: number;
  notifications: Notification[];
}

interface PostComment {
  id: string;
  text: string;
  user_name: string;
  reader_id: string;
  upvotes: number;
  created_at: string;
}

interface Post {
  id: string;
  type: 'quote' | 'review';
  content: string;
  user_name: string;
  reader_id: string;
  upvotes: number;
  created_at: string;
  book_title?: string;
  isbn?: string;
  comments?: PostComment[];
}

// Import axios and its types

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  } as Record<string, string>,
});

// Helper to get JWT token
function getToken(): string {
  return localStorage.getItem('jwtToken') || '';
}

// Add Authorization header for protected endpoints
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Central error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    let message = 'Unknown error';
    if (error.response) {
      message = `Error ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      message = 'No response from server - check if backend is running';
    } else {
      message = error.message;
    }
    console.error(message);
    throw new Error(message);
  }
);

// Fetch all books (public GET /books)
export async function getBooks(): Promise<Book[]> {
  try {
    const data: Book[] | BooksResponse = await apiClient.get('/books');
    return Array.isArray(data) ? data : data.books || [];
  } catch (error) {
    throw error;
  }
}

// Register user (public POST /register)
export async function registerUser(userData: {
  email: string;
  password: string;
  name: string;
  insa_batch: string;
  dorm_number: string;
  educational_status: string;
}): Promise<{ message: string }> {
  return apiClient.post('/register', userData);
}

// Login (public POST /login)
export async function loginUser(credentials: { email: string; password: string }): Promise<LoginResponse> {
  const data: LoginResponse = await apiClient.post('/login', credentials);
  if (data.token) {
    localStorage.setItem('jwtToken', data.token);
  }
  return data;
}

// Borrow hardcopy (protected POST /borrow-book)
export async function borrowBook(isbn: string): Promise<BorrowResponse> {
  return apiClient.post('/borrow-book', { isbn });
}

// Return book (protected POST /return)
export async function returnBook(isbn: string): Promise<ReturnResponse> {
  return apiClient.post('/return', { isbn });
}

// Add softcopy to reading (protected POST /add-soft-to-reading)
export async function addSoftToReading(isbn: string): Promise<AddSoftResponse> {
  return apiClient.post('/add-soft-to-reading', { isbn });
}

// Fetch leaderboard (public GET /leader-board)
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const data: LeaderboardResponse = await apiClient.get('/leader-board');
    console.log('Raw leaderboard response:', data);
    return data.leaderboard || [];
  } catch (error) {
    throw error;
  }
}

// Fetch public reviews (public GET /public-reviews)
export async function getPublicReviews(): Promise<ReviewsResponse> {
  try {
    const data: ReviewsResponse = await apiClient.get('/public-reviews');
    console.log('Raw reviews response:', data);
    return data;
  } catch (error) {
    throw error;
  }
}

// Create review (protected POST /reviews)
export async function createReview(reviewData: {
  isbn: string;
  review_text: string;
}): Promise<{ message: string }> {
  return apiClient.post('/reviews', reviewData);
}

// Fetch public quotes (public GET /search-quotes with empty query for all)
export async function getQuotes(): Promise<QuotesResponse> {
  try {
    const data: QuotesResponse = await apiClient.get('/search-quotes', { params: { query: '' } });
    console.log('Raw quotes response:', data);
    return data;
  } catch (error) {
    throw error;
  }
}

// Get user profile (protected GET /user-profile)
export async function getUserProfile(targetId?: string): Promise<UserProfile> {
  const params = targetId ? { target_id: targetId } : {};
  return apiClient.get('/user-profile', { params });
}

// Get user reading progress (protected GET /user-reading-progress)
export async function getReadingProgress(): Promise<ReadingProgressEntry[]> {
  const data: ReadingProgressResponse = await apiClient.get('/user-reading-progress');
  return data["your reading progress"] || [];
}

// Update reading progress (protected POST /reading-progress)
export async function updateReadingProgress(progressData: {
  isbn: string;
  pages_read: number;
  reflection?: string;
}): Promise<{ message: string }> {
  return apiClient.post('/reading-progress', progressData);
}

// Submit review (protected POST /submit-review)
export async function submitReview(reviewData: {
  isbn: string;
  review_text: string;
}): Promise<{ message: string }> {
  return apiClient.post('/submit-review', reviewData);
}

// Add quote (protected POST /add-quote)
export async function addQuote(quoteData: {
  text: string;
}): Promise<{ message: string; quote_id: string }> {
  return apiClient.post('/add-quote', quoteData);
}

// Toggle upvote on review (protected POST /toggle-upvote)
export async function toggleUpvoteReview(reviewId: string): Promise<{ message: string; upvotes: number }> {
  return apiClient.post('/toggle-upvote', { review_id: reviewId });
}

// Toggle upvote on quote (protected POST /toggle-quote-upvote)
export async function toggleUpvoteQuote(quoteId: string): Promise<{ message: string; upvotes: number }> {
  return apiClient.post(`/toggle-quote-upvote?id=${quoteId}`);
}

// Post comment on review (protected POST /post-comment-review)
export async function postCommentOnReview(commentData: {
  review_id: string;
  text: string;
}): Promise<{ message: string }> {
  return apiClient.post('/post-comment-review', commentData);
}

// Add comment on quote (protected POST /post-comment-quote)
export async function addCommentOnQuote(commentData: {
  quote_id: string;
  text: string;
}): Promise<{ message: string }> {
  return apiClient.post('/post-comment-quote', commentData);
}

// Toggle upvote on review comment (protected POST /toggle-review-comment-upvote)
export async function toggleUpvoteComment(commentId: string): Promise<{ message: string }> {
  return apiClient.post('/toggle-review-comment-upvote', { comment_id: commentId });
}

// Toggle upvote on quote comment (protected POST /toggle-comment-quote-upvote)
export async function toggleUpvoteQuoteComment(commentId: string): Promise<{ message: string; upvotes: number }> {
  return apiClient.post('/toggle-comment-quote-upvote', { comment_id: commentId });
}

// Get notifications (protected GET /list-notifications)
export async function getNotifications(): Promise<NotificationsResponse> {
  return apiClient.get('/list-notifications');
}

// Mark notifications as seen (protected POST /mark-notification-seen)
export async function markNotificationsAsSeen(): Promise<{ message: string }> {
  return apiClient.post('/mark-notification-seen');
}

// Search reviews (public GET /search-reviews)
export async function searchReviews(query?: string, isbn?: string, userId?: string): Promise<{ count: number; reviews: Review[] }> {
  const params: any = {};
  if (query) params.query = query;
  if (isbn) params.isbn = isbn;
  if (userId) params.user_id = userId;
  return apiClient.get('/search-reviews', { params });
}

// Search quotes (public GET /search-quotes)
export async function searchQuotes(query?: string, userId?: string): Promise<QuotesResponse> {
  const params: any = {};
  if (query) params.query = query;
  if (userId) params.user_id = userId;
  return apiClient.get('/search-quotes', { params });
}

// Get book readers (admin GET /check-book-readers)
export async function getBookReaders(isbn: string): Promise<{ isbn: string; active_readers: any[] }> {
  return apiClient.get('/check-book-readers', { data: { isbn } });
}

// Get user borrow history (protected GET /user-borrow-history)
export async function getBorrowHistory(): Promise<BorrowHistoryEntry[]> {
  return apiClient.get('/user-borrow-history');
}

// Get comments for a review (we'll need to create this endpoint or fetch from existing data)
export async function getReviewComments(reviewId: string): Promise<PostComment[]> {
  // This endpoint might not exist yet - we'll need to fetch comments differently
  // For now, return empty array and we'll implement fetching in the component
  return [];
}

// Get comments for a quote (we'll need to create this endpoint or fetch from existing data)
export async function getQuoteComments(quoteId: string): Promise<PostComment[]> {
  // This endpoint might not exist yet - we'll need to fetch comments differently
  // For now, return empty array and we'll implement fetching in the component
  return [];
}
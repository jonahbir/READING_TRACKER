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
  isbn: string;
  reader_id: string;
  review_text: string;
  upvotes: number;
  created_at: string;
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

interface Progress {
  reader_id: string;
  books_borrowed: number;
  books_read: number;
  reading_streak: number;
  latest_badge: string;
}

interface ProgressResponse {
  progress: Progress;
}

interface Comment {
  id: string;
  review_id?: string;
  quote_id?: string;
  reader_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

interface CommentsResponse {
  comments: Comment[];
}


// In api.ts - add export
export interface Notification {
  id: string;
  reader_id: string;
  message: string;
  related_post_id?: string;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
}

interface UserProfile {
  reader_id: string;
  name: string;
  class_tag: string;
  rank_score: number;
  books_read: number;
  badges: string[];
  borrow_history: Array<{
    book_title: string;
    borrow_date: string;
    return_date: string;
    returned: boolean;
  }>;
  created_at?: string; // We'll get this from the user data
}

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

// Fetch leaderboard (public GET /leaderboard)
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

// Create quote (protected POST /quotes)
export async function createQuote(quoteData: {
  text: string;
  book_isbn: string;
}): Promise<{ message: string }> {
  return apiClient.post('/quotes', quoteData);
}

// Fetch user progress (protected GET /progress)
export async function getProgress(): Promise<Progress> {
  try {
    const data: ProgressResponse = await apiClient.get('/progress');
    console.log('Raw progress response:', data);
    return data.progress || {};
  } catch (error) {
    throw error;
  }
}

// Fetch comments for a review or quote (public GET /comments)
export async function getComments(postId: string, type: 'review' | 'quote'): Promise<Comment[]> {
  try {
    const data: CommentsResponse = await apiClient.get('/comments', {
      params: { post_id: postId, type },
    });
    console.log('Raw comments response:', data);
    return data.comments || [];
  } catch (error) {
    throw error;
  }
}

// Create comment (protected POST /comments)
export async function createComment(commentData: {
  review_id?: string;
  quote_id?: string;
  text: string;
}): Promise<{ message: string }> {
  return apiClient.post('/comments', commentData);
}

// Fetch notifications (protected GET /notifications)
export async function getNotifications(): Promise<Notification[]> {
  try {
    const data: NotificationsResponse = await apiClient.get('list-notifications');
    console.log('Raw notifications response:', data);
    return data.notifications || [];
  } catch (error) {
    throw error;
  }
}

// Add to your api.ts file


export async function getUserProfile(readerId: string): Promise<UserProfile> {
  return apiClient.get('/user-profile', { params: { target_id: readerId } });
}

export async function getMyProfile(): Promise<UserProfile> {
  const currentUserId = localStorage.getItem('userId');
  if (!currentUserId) throw new Error('No logged-in user');
  return getUserProfile(currentUserId);
}

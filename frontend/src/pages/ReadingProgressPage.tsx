import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  getReadingProgress, 
  updateReadingProgress, 
  getBooks, 
  addSoftToReading,
  submitReview
} from '../api/api';

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

const ReadingProgressPage: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [readingProgress, setReadingProgress] = useState<ReadingProgressEntry[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showProgressForm, setShowProgressForm] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null);
  const [progressData, setProgressData] = useState({ pages_read: 0, reflection: '' });
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [progress, books] = await Promise.all([
        getReadingProgress(),
        getBooks()
      ]);
      // Sort progress by last_updated date (newest first)
      const sortedProgress = progress.sort((a, b) => 
        new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      );
      setReadingProgress(sortedProgress);
      // Filter for softcopy books that are available
      setAvailableBooks(books.filter(book => book.Type === 'softcopy' && book.Available));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSoftcopyBook = async (book: Book) => {
    try {
      setSubmitting(true);
      await addSoftToReading(book.ISBN);
      setShowAddBook(false);
      setSelectedBook(null);
      loadData(); // Reload to show the new book
    } catch (error) {
      console.error('Error adding book to reading list:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (isbn: string) => {
    try {
      setSubmitting(true);
      await updateReadingProgress({
        isbn,
        pages_read: progressData.pages_read,
        reflection: progressData.reflection
      });
      setShowProgressForm(null);
      setProgressData({ pages_read: 0, reflection: '' });
      loadData(); // Reload to show updated progress
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (isbn: string) => {
    try {
      setSubmitting(true);
      await submitReview({
        isbn,
        review_text: reviewText
      });
      setShowReviewForm(null);
      setReviewText('');
      // Show success message
      alert('Review submitted! It will be visible after admin approval.');
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateProgress = (pagesRead: number, totalPages: number) => {
    return totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0;
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') return 'Not started';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your reading progress</h1>
          <p>You need to be logged in to track your reading progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Reading Progress</h1>
          <p className="text-blue-200">Track your reading journey and celebrate your achievements</p>
        </motion.div>

        {/* Add Book Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <motion.button
            onClick={() => setShowAddBook(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add Softcopy Book to Reading List
          </motion.button>
        </motion.div>

        {/* Reading Progress List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading your reading progress...</p>
            </div>
          ) : readingProgress.length === 0 ? (
            <div className="text-center text-white">
              <p className="text-xl">No books in your reading list yet</p>
              <p className="text-blue-200 mt-2">Add a softcopy book to start tracking your progress!</p>
            </div>
          ) : (
            readingProgress.map((book, index) => {
              const progressPercentage = calculateProgress(book.pages_read, book.total_page);
              
              return (
                <motion.div
                  key={book.isbn}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Book Info */}
                    <div className="flex-1 mb-4 lg:mb-0">
                      <h3 className="text-xl font-bold text-white mb-2">{book.title}</h3>
                      <p className="text-blue-200 mb-2">by {book.author}</p>
                      <div className="flex items-center space-x-4 text-sm text-blue-200">
                        <span>Started: {formatDate(book.start_date)}</span>
                        <span>Streak: {book.streak_days} days</span>
                        <span>Last Updated: {formatDate(book.last_updated)}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-semibold">
                            {book.pages_read} / {book.total_page} pages
                          </span>
                          <span className="text-blue-200">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <motion.div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                      </div>

                      {/* Reflection */}
                      {book.reflection && (
                        <div className="mt-4 p-3 bg-white/10 rounded-lg">
                          <p className="text-white text-sm italic">"{book.reflection}"</p>
                        </div>
                      )}

                      {/* Completion Status */}
                      {book.competed_status && (
                        <div className="mt-4 flex items-center space-x-2">
                          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-400 font-semibold">Completed on {formatDate(book.completed_date)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 lg:ml-6">
                      <motion.button
                        onClick={() => {
                          setShowProgressForm(book.isbn);
                          setProgressData({ pages_read: book.pages_read, reflection: book.reflection });
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Update Progress
                      </motion.button>
                      
                      {book.competed_status && (
                        <motion.button
                          onClick={() => setShowReviewForm(book.isbn)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Write Review
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Add Book Modal */}
        {showAddBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Add Softcopy Book</h2>
                <button
                  onClick={() => setShowAddBook(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {availableBooks.map((book) => (
                  <div key={book.ISBN} className="border rounded-lg p-4 hover:bg-gray-50">
                    <h3 className="font-bold text-lg">{book.Title}</h3>
                    <p className="text-gray-600">by {book.Author}</p>
                    <p className="text-sm text-gray-500 mt-2">{book.AboutTheBook}</p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500">{book.TotalPages} pages</span>
                      <motion.button
                        onClick={() => handleAddSoftcopyBook(book)}
                        disabled={submitting}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                        whileHover={!submitting ? { scale: 1.05 } : {}}
                        whileTap={!submitting ? { scale: 0.95 } : {}}
                      >
                        {submitting ? 'Adding...' : 'Add to Reading List'}
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Progress Update Modal */}
        {showProgressForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Update Progress</h2>
                <button
                  onClick={() => setShowProgressForm(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pages Read
                  </label>
                  <input
                    type="number"
                    value={progressData.pages_read}
                    onChange={(e) => setProgressData({ ...progressData, pages_read: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reflection (Optional)
                  </label>
                  <textarea
                    value={progressData.reflection}
                    onChange={(e) => setProgressData({ ...progressData, reflection: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows={3}
                    placeholder="Share your thoughts about this book..."
                  />
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    onClick={() => handleUpdateProgress(showProgressForm)}
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    whileHover={!submitting ? { scale: 1.05 } : {}}
                    whileTap={!submitting ? { scale: 0.95 } : {}}
                  >
                    {submitting ? 'Updating...' : 'Update Progress'}
                  </motion.button>
                  <button
                    onClick={() => setShowProgressForm(null)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Write Review</h2>
                <button
                  onClick={() => setShowReviewForm(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows={5}
                    placeholder="Share your thoughts about this book..."
                  />
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    onClick={() => handleSubmitReview(showReviewForm)}
                    disabled={submitting || !reviewText.trim()}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    whileHover={!submitting && reviewText.trim() ? { scale: 1.05 } : {}}
                    whileTap={!submitting && reviewText.trim() ? { scale: 0.95 } : {}}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </motion.button>
                  <button
                    onClick={() => setShowReviewForm(null)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingProgressPage;

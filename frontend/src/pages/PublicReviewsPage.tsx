import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPublicReviews, getBooks } from './../api/api';

interface Review {
  id?: string;
  _id?: string;
  isbn: string;
  reader_id: string;
  review_text: string;
  upvotes: number;
  created_at: string;
  user_name?: string;
}

interface Book {
  ID: string;
  Title: string;
  Author: string;
  ISBN: string;
  Genre: string;
}

const PublicReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reviewsData, booksData] = await Promise.all([
          getPublicReviews(),
          getBooks()
        ]);
        
        setReviews(reviewsData.reviews || []);
        setBooks(booksData || []);
      } catch (error: any) {
        console.error('Fetch error details:', error.message);
        setError('Error loading reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBookInfo = (isbn: string) => {
    const book = books.find(book => book.ISBN === isbn);
    return book || null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRandomGenreColor = () => {
    const colors = [
      'from-blue-500 to-blue-700',
      'from-purple-500 to-purple-700',
      'from-green-500 to-green-700',
      'from-yellow-500 to-yellow-700',
      'from-red-500 to-red-700',
      'from-indigo-500 to-indigo-700',
      'from-pink-500 to-pink-700',
      'from-teal-500 to-teal-700'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    },
    hover: {
      scale: 1.05,
      color: '#93c5fd',
      transition: { duration: 0.3 }
    }
  };

  // Icons for the page
  const ReviewIcons = {
    quote: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    book: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
    user: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
    heart: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    ),
    calendar: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    )
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-400 text-xl mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-400 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={titleVariants}
          >
            Community Reviews 📚
          </motion.h1>
          <p className="text-blue-200 text-lg mb-6 max-w-2xl mx-auto">
            Discover what fellow readers are saying about their favorite books. Get inspired by honest opinions and share your own thoughts!
          </p>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">{reviews.length}</div>
              <div className="text-blue-200">Total Reviews</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">
                {reviews.reduce((sum, review) => sum + review.upvotes, 0)}
              </div>
              <div className="text-blue-200">Total Upvotes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">
                {new Set(reviews.map(review => review.reader_id)).size}
              </div>
              <div className="text-blue-200">Active Reviewers</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Reviews Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {reviews.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto border border-white/20">
                <div className="text-blue-300 mb-4">
                  {ReviewIcons.quote}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Reviews Yet</h3>
                <p className="text-blue-200">Be the first to share your thoughts about a book!</p>
              </div>
            </div>
          ) : (
            reviews.map((review, index) => {
              const bookInfo = getBookInfo(review.isbn);
              const genreColor = getRandomGenreColor();

              return (
                <motion.div
                  key={review.id || review._id || index}
                  variants={itemVariants}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
                  whileHover={{ 
                    scale: 1.02, 
                    y: -5,
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {/* Book Info Header */}
                  <div className="mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${genreColor} rounded-full flex items-center justify-center text-white font-bold text-sm mb-3`}>
                      {ReviewIcons.book}
                    </div>
                    
                    {bookInfo ? (
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
                          {bookInfo.Title}
                        </h3>
                        <p className="text-blue-200 text-sm mb-2">by {bookInfo.Author}</p>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs">
                            {bookInfo.Genre}
                          </span>
                          <span className="text-blue-300 text-xs flex items-center">
                            {ReviewIcons.calendar}
                            <span className="ml-1">{formatDate(review.created_at)}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-1">
                          Unknown Book
                        </h3>
                        <p className="text-blue-200 text-sm">ISBN: {review.isbn || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="mb-4">
                    <div className="flex items-start mb-3">
                      <div className="text-blue-300 mr-2 mt-1">
                        {ReviewIcons.quote}
                      </div>
                      <p className="text-white leading-relaxed line-clamp-4">
                        "{review.review_text}"
                      </p>
                    </div>
                  </div>

                  {/* Reviewer Info and Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {ReviewIcons.user}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {review.user_name || `Reader ${review.reader_id.slice(-4)}`}
                        </p>
                        <p className="text-blue-200 text-xs">@{review.reader_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-red-400">
                      {ReviewIcons.heart}
                      <span className="text-white font-semibold">{review.upvotes}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-2xl mx-auto border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Share Your Thoughts?
            </h3>
            <p className="text-blue-200 mb-6">
              Join our community of readers and share your insights about the books you love!
            </p>
            <Link
              to="/register"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="flex items-center space-x-2">
                {ReviewIcons.quote}
                <span>Join to Write Your Review</span>
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicReviews;
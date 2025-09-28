import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublicReviews, getQuotes, createComment } from './../api/api';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const [reviewsData, quotesData] = await Promise.all([getPublicReviews(), getQuotes()]);
        const combinedPosts = [
          ...reviewsData.reviews.map((r: any) => ({ ...r, type: 'review' })),
          ...quotesData.quotes.map((q: any) => ({ ...q, type: 'quote' })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPosts(combinedPosts);
        setIsLoggedIn(!!localStorage.getItem('jwtToken'));
      } catch (error: any) {
        setError(error.message || 'Error loading feed.');
      }
    };
    fetchPosts();
    const interval = setInterval(fetchPosts, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCommentSubmit = async (postId: string, type: 'review' | 'quote') => {
    if (!isLoggedIn) {
      alert('Please log in to comment.');
      return;
    }
    const text = newComment[postId];
    if (!text) return;
    try {
      await createComment({ [`${type}_id`]: postId, text });
      setNewComment({ ...newComment, [postId]: '' });
      // Refresh posts
      const [reviewsData, quotesData] = await Promise.all([getPublicReviews(), getQuotes()]);
      setPosts([
        ...reviewsData.reviews.map((r: any) => ({ ...r, type: 'review' })),
        ...quotesData.quotes.map((q: any) => ({ ...q, type: 'quote' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error: any) {
      alert(error.message || 'Error posting comment.');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const commentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  if (error) return <div className="py-20 text-center text-red-500 text-xl">{error}</div>;

  return (
    <section className="py-20 bg-gradient-to-b from-indigo-950 to-black min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-white mb-12 text-center tracking-tight"
          initial="hidden"
          whileInView="visible"
          whileHover={{ scale: 1.05, color: '#10b981' }}
          viewport={{ once: true }}
        >
          Social Feed
        </motion.h2>
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {posts.length === 0 ? (
            <p className="text-center text-gray-300">No posts available.</p>
          ) : (
            posts.map((post) => (
              <motion.div
                key={post.id}
                className="bg-slate-900 p-6 rounded-lg shadow-lg mb-6"
                variants={itemVariants}
              >
                {/* Header */}
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {post.user_name?.[0] || post.reader_id?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{post.user_name || post.reader_id || 'Unknown'}</p>
                    <p className="text-gray-300 text-sm">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {/* Body */}
                {post.type === 'review' ? (
                  <div>
                    <p className="text-white font-medium mb-2">Book ISBN: {post.isbn}</p>
                    <p className="text-gray-300 line-clamp-3">{post.review_text}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-white italic mb-2">"{post.text}"</p>
                    <p className="text-gray-300 text-sm">From Book (ISBN: {post.book_isbn})</p>
                  </div>
                )}
                {/* Footer */}
                <div className="flex space-x-4 mt-4">
                  <motion.button
                    className="text-gray-300 hover:text-emerald-500 flex items-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                    {post.upvotes || 0}
                  </motion.button>
                  <motion.button
                    className="text-gray-300 hover:text-emerald-500 flex items-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5v-2a2 2 0 012-2h10a2 2 0 012 2v2h-4m-6 0h6" />
                    </svg>
                    Comment
                  </motion.button>
                </div>
                {/* Comment Input */}
                {isLoggedIn && (
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="w-full px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                    />
                    <motion.button
                      className="mt-2 bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCommentSubmit(post.id, post.type)}
                    >
                      Post Comment
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Feed;
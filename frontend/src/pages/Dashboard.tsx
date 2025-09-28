import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProgress, getPublicReviews, getQuotes } from './../api/api';

const Dashboard: React.FC = () => {
  const [progress, setProgress] = useState<any>({});
  const [reviews, setReviews] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressData, reviewsData, quotesData] = await Promise.all([
          getProgress(),
          getPublicReviews(),
          getQuotes(),
        ]);
        setProgress(progressData);
        setReviews(reviewsData.reviews.slice(0, 1)); // Latest review
        setQuotes(quotesData.quotes.slice(0, 1)); // Latest quote
      } catch (error: any) {
        setError(error.message || 'Error loading dashboard data.');
      }
    };
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    hover: { scale: 1.05, color: '#10b981', transition: { duration: 0.3 } },
  };

  if (error) return <div className="py-20 text-center text-red-500 text-xl">{error}</div>;

  return (
    <section className="py-20 bg-gradient-to-b from-indigo-950 to-black min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-white mb-12 text-center tracking-tight"
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
          viewport={{ once: true }}
        >
          Dashboard
        </motion.h2>
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {/* Progress Summary */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-900 p-6 rounded-lg shadow-lg text-center">
              <p className="text-gray-300 mb-2">Books Borrowed</p>
              <p className="text-3xl font-bold text-white">{progress.books_borrowed || 0}</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-lg shadow-lg text-center">
              <p className="text-gray-300 mb-2">Reading Streak</p>
              <p className="text-3xl font-bold text-white">{progress.reading_streak || 0} days</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-lg shadow-lg text-center">
              <p className="text-gray-300 mb-2">Latest Badge</p>
              <p className="text-xl font-bold text-white">{progress.latest_badge || 'None'}</p>
            </div>
          </motion.div>

          {/* Mini-Feed */}
          <motion.h3
            className="text-2xl font-semibold text-white mb-6"
            variants={itemVariants}
          >
            Latest Activity
          </motion.h3>
          <motion.div variants={itemVariants} className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-slate-900 p-6 rounded-lg shadow-lg">
                <p className="text-gray-300 text-sm mb-2">Review by {review.reader_id}</p>
                <p className="text-white">{review.review_text}</p>
              </div>
            ))}
            {quotes.map((quote) => (
              <div key={quote.id} className="bg-slate-900 p-6 rounded-lg shadow-lg">
                <p className="text-gray-300 text-sm mb-2">Quote by {quote.user_name}</p>
                <p className="text-white italic">"{quote.text}"</p>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="mt-12 text-center space-x-4">
            <Link
              to="/books"
              className="inline-block bg-emerald-500 text-white px-6 py-3 rounded-md hover:bg-emerald-600 transition-colors"
            >
              <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                Go to Books
              </motion.span>
            </Link>
            <Link
              to="/feed"
              className="inline-block bg-emerald-500 text-white px-6 py-3 rounded-md hover:bg-emerald-600 transition-colors"
            >
              <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                Go to Feed
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Dashboard;
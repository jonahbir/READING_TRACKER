import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuotes } from '../api/api'; // Adjust path as needed

const PublicQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const data = await getQuotes();
        setQuotes(data.quotes || []);
      } catch (error: any) {
        console.error('Fetch error details:', error.message);
        setError('Error loading quotes. Check console for details.');
      }
    };

    fetchQuotes();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (quotes.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
      }, 5000); // Change quote every 5 seconds
      return () => clearInterval(interval);
    }
  }, [quotes]);

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
    hover: {
      scale: 1.05,
      color: '#a5b4fc',
      transition: { duration: 0.3 },
    },
  };

  const quoteVariants = {
    enter: { opacity: 0, x: 100 },
    center: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -100, transition: { duration: 0.5 } },
  };

  if (error) return <div className="py-20 text-center text-red-500 text-xl">{error}</div>;

  return (
    <section id="public-quotes" className="py-20 bg-gradient-to-b from-indigo-950 to-indigo-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-white mb-12 text-center tracking-tight"
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
          viewport={{ once: true }}
          variants={titleVariants}
        >
          Public Quotes
        </motion.h2>
        {quotes.length === 0 ? (
          <p className="text-center text-gray-300">No quotes available.</p>
        ) : (
          <div className="relative h-64 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="bg-indigo-800 p-6 rounded-lg shadow-lg text-center max-w-md w-full"
                variants={quoteVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <p className="text-gray-200 mb-4 line-clamp-3">"{quotes[currentIndex].text}"</p>
                <p className="text-sm text-gray-300">By {quotes[currentIndex].user_name || 'Unknown'}</p>
                <p className="text-sm text-gray-300">Upvotes: {quotes[currentIndex].upvotes}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        <div className="mt-12 text-center">
          <Link
            to="/register"
            className="inline-block bg-emerald-500 text-white px-6 py-3 rounded-md hover:bg-emerald-600 transition-colors duration-300"
          >
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              Join to share your favorite quote
            </motion.span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PublicQuotes;
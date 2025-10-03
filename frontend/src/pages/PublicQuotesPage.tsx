import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuotes } from '../api/api';

interface Quote {
  id: string;
  text: string;
  user_name: string;
  reader_id: string;
  upvotes: number;
  created_at: string;
}

const PublicQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const data = await getQuotes();
        setQuotes(data.quotes || []);
      } catch (error: any) {
        console.error('Fetch error details:', error.message);
        setError('Error loading quotes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (quotes.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
      }, 6000); // Change quote every 6 seconds
      return () => clearInterval(interval);
    }
  }, [quotes]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRandomGradient = () => {
    const gradients = [
      'from-blue-500 to-blue-700',
      'from-purple-500 to-purple-700',
      'from-green-500 to-green-700',
      'from-yellow-500 to-yellow-700',
      'from-red-500 to-red-700',
      'from-indigo-500 to-indigo-700',
      'from-pink-500 to-pink-700',
      'from-teal-500 to-teal-700'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
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

  const quoteVariants = {
    enter: { opacity: 0, x: 100 },
    center: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
    exit: { opacity: 0, x: -100, transition: { duration: 0.5 } }
  };

  // Icons for the page
  const QuoteIcons = {
    quote: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    heart: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    ),
    user: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
    calendar: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
    share: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
      </svg>
    )
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading inspiring quotes...</p>
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
            Inspiring Quotes ✨
          </motion.h1>
          <p className="text-blue-200 text-lg mb-6 max-w-2xl mx-auto">
            Discover wisdom and inspiration shared by our reading community. Each quote tells a story!
          </p>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">{quotes.length}</div>
              <div className="text-blue-200">Total Quotes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">
                {quotes.reduce((sum, quote) => sum + quote.upvotes, 0)}
              </div>
              <div className="text-blue-200">Total Upvotes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">
                {new Set(quotes.map(quote => quote.reader_id)).size}
              </div>
              <div className="text-blue-200">Quote Contributors</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Quote Carousel */}
        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto border border-white/20">
              <div className="text-blue-300 mb-4">
                {QuoteIcons.quote}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Quotes Yet</h3>
              <p className="text-blue-200">Be the first to share an inspiring quote!</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto mb-12">
            {/* Featured Quote Carousel */}
            <div className="relative h-96 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20 w-full max-w-2xl mx-auto"
                  variants={quoteVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <div className="text-center">
                    <div className="text-blue-300 mb-6">
                      {QuoteIcons.quote}
                    </div>
                    
                    <blockquote className="text-white text-xl md:text-2xl leading-relaxed mb-6 italic">
                      "{quotes[currentIndex].text}"
                    </blockquote>

                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                        {QuoteIcons.user}
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold">
                          {quotes[currentIndex].user_name || 'Anonymous Reader'}
                        </p>
                        <p className="text-blue-200 text-sm">@{quotes[currentIndex].reader_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-6 text-sm text-blue-200">
                      <div className="flex items-center space-x-1">
                        {QuoteIcons.heart}
                        <span className="text-white font-semibold">{quotes[currentIndex].upvotes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {QuoteIcons.calendar}
                        <span>{formatDate(quotes[currentIndex].created_at)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {quotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Additional Quotes Grid */}
        {quotes.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <h3 className="text-2xl font-bold text-white text-center mb-6">More Inspiring Quotes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quotes.slice(0, 6).map((quote, index) => (
                <motion.div
                  key={quote.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
                  whileHover={{ 
                    scale: 1.02, 
                    y: -3,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div className={`w-10 h-10 bg-gradient-to-r ${getRandomGradient()} rounded-full flex items-center justify-center text-white mb-4`}>
                    {QuoteIcons.quote}
                  </div>
                  <p className="text-white leading-relaxed mb-4 line-clamp-3">"{quote.text}"</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-200 font-medium">
                      {quote.user_name || 'Anonymous'}
                    </span>
                    <div className="flex items-center space-x-1 text-red-400">
                      {QuoteIcons.heart}
                      <span className="text-white">{quote.upvotes}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-2xl mx-auto border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              Share Your Wisdom 📖
            </h3>
            <p className="text-blue-200 mb-6">
              Got a favorite quote that inspires you? Share it with our community and spread the inspiration!
            </p>
            <Link
              to="/register"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="flex items-center space-x-2 justify-center">
                {QuoteIcons.share}
                <span>Join to Share Your Quote</span>
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicQuotes;
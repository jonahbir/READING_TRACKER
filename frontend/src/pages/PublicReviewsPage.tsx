import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPublicReviews } from './../api/api'; // Adjust path as needed

const PublicReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getPublicReviews();
        setReviews(data.reviews || []);
      } catch (error: any) {
        console.error('Fetch error details:', error.message);
        setError('Error loading reviews. Check console for details.');
      }
    };

    fetchReviews();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] },
    },
  };

  const cardVariants = {
    hover: {
      scale: 1.05,
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.4)',
      transition: { type: 'spring', stiffness: 250, damping: 15 },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
    bounce: {
      y: [0, -15, 0, 5, 0],
      transition: { duration: 0.8, ease: 'easeOut', times: [0, 0.2, 0.5, 0.8, 1] },
    },
  };

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

  if (error) return <div className="py-20 text-center text-red-500 text-xl">{error}</div>;

  return (
    <section id="public-reviews" className="py-20 bg-gradient-to-b from-indigo-950 to-indigo-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-white mb-12 text-center tracking-tight"
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
          viewport={{ once: true }}
          variants={titleVariants}
        >
          Public Reviews
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {reviews.length === 0 ? (
            <p className="text-center text-gray-300 col-span-full">No reviews available.</p>
          ) : (
            reviews.map((review, index) => (
              <motion.div
                key={index} // Use index as key if no unique id; ideally use review.id if available
                className="bg-indigo-800 p-6 rounded-lg shadow-lg text-center cursor-pointer hover:shadow-xl transition-shadow duration-300"
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                whileInView="bounce"
                viewport={{ once: false, margin: "-50px" }}
              >
                <p className="text-sm text-gray-300 mb-2">Book ISBN: {review.isbn}</p>
                <p className="text-sm text-gray-300 mb-2">Reviewer ID: {review.reader_id}</p>
                <p className="text-gray-200 mb-4 line-clamp-3">{review.review_text}</p>
                <p className="text-sm text-gray-300">Upvotes: {review.upvotes}</p>
              </motion.div>
            ))
          )}
        </motion.div>
        <div className="mt-12 text-center">
          <Link
            to="/register"
            className="inline-block bg-emerald-500 text-white px-6 py-3 rounded-md hover:bg-emerald-600 transition-colors duration-300"
          >
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              Join to write your own review
            </motion.span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PublicReviews;
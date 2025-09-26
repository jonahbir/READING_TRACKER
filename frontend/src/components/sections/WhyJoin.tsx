import React from 'react';
import { motion } from 'framer-motion';

// Why Join section component
const WhyJoin: React.FC = () => {
  // Animation variants
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
      transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }, // Smooth easing
    },
  };

  const cardVariants = {
    hover: { 
      scale: 1.1, 
      boxShadow: '0 15px 30px rgba(59, 130, 246, 0.4)',
      backgroundColor: '#F3F4F6',
      transition: { type: 'spring', stiffness: 250, damping: 15 },
    },
    tap: { 
      scale: 0.95, 
      transition: { type: 'spring', stiffness: 500, damping: 20 },
    },
  };

  return (
    <section id="why-join" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-emerald-600 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
        >
          Why Join Us?
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Benefit 1 */}
          <motion.div
            className="bg-indigo-50 p-6 rounded-lg shadow-md text-center cursor-pointer"
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <div className="text-emerald-600 text-4xl mb-4">🌟</div>
            <h3 className="text-xl font-semibold mb-2">Community</h3>
            <p className="text-gray-600">Connect with fellow readers and share your journey.</p>
          </motion.div>
          {/* Benefit 2 */}
          <motion.div
            className="bg-indigo-50 p-6 rounded-lg shadow-md text-center cursor-pointer"
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <div className="text-emerald-600 text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Book Discovery</h3>
            <p className="text-gray-600">Explore new books and get personalized recommendations.</p>
          </motion.div>
          {/* Benefit 3 */}
          <motion.div
            className="bg-indigo-50 p-6 rounded-lg shadow-md text-center cursor-pointer"
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <div className="text-emerald-600 text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">Rewards</h3>
            <p className="text-gray-600">Earn badges and compete on the leaderboard.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyJoin;
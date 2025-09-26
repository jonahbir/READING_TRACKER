import React from 'react';
import { motion } from 'framer-motion';

// How It Works section component
const HowItWorks: React.FC = () => {
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

  // Hover / tap objects (used with whileHover / whileTap — NOT as a second `variants` prop)
 const hoverAnimation = {
  scale: 1.1,
  boxShadow: '0 15px 30px rgba(59, 130, 246, 0.4)',
  backgroundColor: '#F3F4F6',
  transition: {
    type: 'spring',
    stiffness: 120, // much lower → slower motion
    damping: 14,    // balances overshoot
    mass: 1.2,      // heavier = slower bounce
  },
};


  const tapAnimation = {
    scale: 0.95,
    transition: { type: 'spring', stiffness: 500, damping: 20 },
  };

  return (
    <section id="how-it-works" className="py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-indigo-600 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
        >
          How It Works
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Step 1 */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md text-center cursor-pointer"
            variants={itemVariants}        // entry animation (no duplicate prop)
            whileHover={hoverAnimation}    // hover animation object
            whileTap={tapAnimation}        // tap animation object
          >
            <div className="text-indigo-600 text-4xl mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
            <p className="text-gray-600">Create an account to join the INSA Reading Challenge community.</p>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md text-center cursor-pointer"
            variants={itemVariants}
            whileHover={hoverAnimation}
            whileTap={tapAnimation}
          >
            <div className="text-indigo-600 text-4xl mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">Track Reading</h3>
            <p className="text-gray-600">Log your books and track your progress with ease.</p>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md text-center cursor-pointer"
            variants={itemVariants}
            whileHover={hoverAnimation}
            whileTap={tapAnimation}
          >
            <div className="text-indigo-600 text-4xl mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
            <p className="text-gray-600">Unlock badges and climb the leaderboard as you read!</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;

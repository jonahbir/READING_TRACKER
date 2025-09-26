import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Hero section component
const Hero: React.FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] },
    },
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05, 
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
      background: 'linear-gradient(90deg, #fff, #f0f0f0, #fff)',
      backgroundSize: '200% 100%',
      backgroundPosition: ['200% 0', '0 0'], // shimmer effect
      transition: { duration: 1 },
    },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };

  const gradientVariants = {
    initial: { background: 'linear-gradient(90deg, #4B0082, #00CED1)' },
    animate: {
      background: [
        'linear-gradient(90deg, #4B0082, #00CED1)',
        'linear-gradient(90deg, #00CED1, #4B0082)',
      ],
      transition: { duration: 6, repeat: Infinity, repeatType: 'reverse' as const },
    },
  };

  return (
    <motion.section
      id="hero"
      className="relative py-20 overflow-hidden"
      initial="initial"
      animate="animate"
      variants={gradientVariants}
    >
      {/* Background Glow Pulse */}
      <motion.div
        className="absolute inset-0 bg-indigo-500/20 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between">
        {/* Text Content */}
        <motion.div
          className="md:w-1/2 mb-10 md:mb-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Typewriter-style Title */}
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {"Welcome to INSA Reading Challenge".split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl mb-6"
            variants={itemVariants}
          >
            Track your reading, explore books, and join a community of book lovers!
          </motion.p>
          <motion.div variants={itemVariants}>
            <Link
              to="/register"
              className="bg-white text-indigo-600 px-6 py-3 rounded-md font-semibold inline-block overflow-hidden"
            >
              <motion.span
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="block"
              >
                Start Your Journey
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Image */}
        <motion.div
          className="md:w-1/2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.img
  src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80"
  alt="Stack of books"
  className="rounded-lg shadow-lg"
  variants={itemVariants}
  whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
  animate={{ y: [0, -15, 0] }}   // slightly higher float
  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} // slower & smoother
/>

        </motion.div>
      </div>
    </motion.section>
  );
};

export default Hero;

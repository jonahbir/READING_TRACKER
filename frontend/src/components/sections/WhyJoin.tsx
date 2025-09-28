import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Wrapper with flexible height (no forced h-screen)
const SectionWrapper: React.FC<{ id: string; children: React.ReactNode; bg?: string }> = ({
  id,
  children,
  bg = 'bg-gray-100',
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -80]); // softer parallax

  return (
    <motion.section
      id={id}
      style={{ y }}
      className={`${bg} relative z-30 py-20`} // normal padding, no h-screen
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {children}
      </div>
    </motion.section>
  );
};

// Why Join section component
const WhyJoin: React.FC = () => {
  // Title animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    },
    hover: {
      scale: 1.05,
      color: "#4B0082", // Using indigo to match other sections
      textShadow: "0 5px 15px rgba(75, 0, 130, 0.3)",
      y: -5,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10
      }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] },
    },
  };

  // Enhanced card animations
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: "easeOut" }
    },
    hover: {
      scale: 1.08,
      y: -12,
      rotateY: 5,
      boxShadow: '0 25px 50px rgba(79, 70, 229, 0.3)', // Indigo shadow
      backgroundColor: '#fafafa',
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 12, 
        mass: 0.8 
      },
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.2 },
    },
    bounce: {
      y: [0, -15, 0, -8, 0],
      scale: [1, 1.02, 1, 1.01, 1],
      transition: { 
        duration: 4, 
        ease: 'easeInOut',
        times: [0, 0.2, 0.5, 0.8, 1],
        repeat: Infinity,
        repeatDelay: 2
      },
    },
  };

  // Professional icons with indigo theme
  const CommunityIcon = () => (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.circle
        cx="32"
        cy="32"
        r="30"
        fill="url(#communityGradient)"
        stroke="#4B0082"
        strokeWidth="2"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6 }}
      />
      <circle cx="22" cy="26" r="4" fill="white"/>
      <circle cx="42" cy="26" r="4" fill="white"/>
      <path d="M18 40C18 35 22 32 32 32C42 32 46 35 46 40" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="communityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
    </svg>
  );

  const DiscoveryIcon = () => (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M32 12L40 24L52 28L44 40L44 52L32 48L20 52L20 40L12 28L24 24L32 12Z"
        fill="url(#discoveryGradient)"
        stroke="#4B0082"
        strokeWidth="2"
        initial={{ scale: 0.8, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8 }}
      />
      <circle cx="32" cy="32" r="4" fill="white"/>
      <defs>
        <linearGradient id="discoveryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
    </svg>
  );

  const RewardsIcon = () => (
    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M32 8L38 22L52 24L42 34L44 48L32 42L20 48L22 34L12 24L26 22L32 8Z"
        fill="url(#rewardsGradient)"
        stroke="#4B0082"
        strokeWidth="2"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      <circle cx="32" cy="32" r="3" fill="white"/>
      <defs>
        <linearGradient id="rewardsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
    </svg>
  );

  return (
    <SectionWrapper id="why-join" bg-gradient-to-b from-gray-1 to-gray-600>
      {/* Centered heading with hover effects */}
      <div className="flex justify-center mb-16">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-center text-indigo-900 cursor-pointer relative inline-block"
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
          whileTap="tap"
          viewport={{ once: true }}
          variants={titleVariants}
        >
          Why Join Us?
          {/* Animated underline */}
          <motion.div
            className="absolute bottom-0 left-0 w-0 h-1.5 bg-indigo-600 rounded-full"
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </motion.h2>
      </div>

      {/* Benefits Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {/* Benefit 1 - Community */}
        <motion.div
          className="bg-white p-8 rounded-2xl shadow-lg cursor-pointer border-2 border-gray-100 hover:border-indigo-200 relative overflow-hidden group"
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
          initial="bounce"
          animate="bounce"
        >
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
          
          {/* Icon */}
          <motion.div 
            className="flex justify-center mb-6"
            whileHover={{ scale: 1.15, rotateY: 15 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <CommunityIcon />
          </motion.div>

          <h3 className="text-2xl font-bold text-center text-indigo-900 mb-4 group-hover:text-indigo-700 transition-colors">
            Community
          </h3>
          <p className="text-gray-600 text-center leading-relaxed">
            Connect with fellow readers, share your journey, and participate in engaging discussions 
            with a vibrant community of book lovers.
          </p>
        </motion.div>

        {/* Benefit 2 - Book Discovery */}
        <motion.div
          className="bg-white p-8 rounded-2xl shadow-lg cursor-pointer border-2 border-gray-100 hover:border-indigo-200 relative overflow-hidden group"
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
          initial="bounce"
          animate="bounce"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 to-indigo-500"></div>
          
          <motion.div 
            className="flex justify-center mb-6"
            whileHover={{ scale: 1.15, rotateY: 15 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <DiscoveryIcon />
          </motion.div>

          <h3 className="text-2xl font-bold text-center text-indigo-900 mb-4 group-hover:text-indigo-700 transition-colors">
            Book Discovery
          </h3>
          <p className="text-gray-600 text-center leading-relaxed">
            Explore new books, get personalized recommendations, and discover hidden gems 
            based on your reading preferences and interests.
          </p>
        </motion.div>

        {/* Benefit 3 - Rewards */}
        <motion.div
          className="bg-white p-8 rounded-2xl shadow-lg cursor-pointer border-2 border-gray-100 hover:border-indigo-200 relative overflow-hidden group"
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
          initial="bounce"
          animate="bounce"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          
          <motion.div 
            className="flex justify-center mb-6"
            whileHover={{ scale: 1.15, rotateY: 15 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <RewardsIcon />
          </motion.div>

          <h3 className="text-2xl font-bold text-center text-indigo-900 mb-4 group-hover:text-indigo-700 transition-colors">
            Rewards & Recognition
          </h3>
          <p className="text-gray-600 text-center leading-relaxed">
            Earn badges, climb the leaderboard, and get recognized for your reading achievements 
            with our exciting reward system.
          </p>
        </motion.div>
      </motion.div>

      {/* Additional call to action */}
      <motion.div 
        className="text-center mt-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
      >
        <p className="text-lg text-indigo-900 font-semibold">
          Join dedicated readers who have already transformed their reading habits!
        </p>
      </motion.div>
    </SectionWrapper>
  );
};

export default WhyJoin;
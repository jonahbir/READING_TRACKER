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
      transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] },
    },
  };

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
      color: "#4B0082",
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

  // Hover / tap objects for cards
  const hoverAnimation = {
    scale: 1.1,
    boxShadow: '0 15px 30px rgba(59, 130, 246, 0.4)',
    backgroundColor: '#F3F4F6',
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 14,
      mass: 1.2,
    },
  };

  const tapAnimation = {
    scale: 0.95,
    transition: { type: 'spring', stiffness: 500, damping: 20 },
  };

  return (
    <SectionWrapper id="how-it-works" bg="bg-gray-10">
      {/* Centered container for the heading */}
      <div className="flex justify-center mb-12">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-center text-indigo-900 cursor-pointer relative inline-block"
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
          whileTap="tap"
          viewport={{ once: true }}
          variants={titleVariants}
        >
          How It Works
          {/* Animated underline on hover */}
          <motion.div
            className="absolute bottom-0 left-0 w-0 h-1 bg-indigo-600 rounded-full"
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </motion.h2>
      </div>

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
          variants={itemVariants}
          whileHover={hoverAnimation}
          whileTap={tapAnimation}
        >
          <div className="text-indigo-600 text-4xl mb-4">1</div>
          <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
          <p className="text-gray-600">
            Create an account to join the INSA Reading Challenge community.
          </p>
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
          <p className="text-gray-600">
            Log your books and track your progress with ease.
          </p>
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
          <p className="text-gray-600">
            Unlock badges and climb the leaderboard as you read!
          </p>
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
};

export default HowItWorks;
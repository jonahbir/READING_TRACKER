import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { motion } from 'framer-motion';

// Navbar component for the INSA Reading Challenge app
const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle mobile menu
  const toggleMenu = () => setIsOpen(!isOpen);

  // Animation variants for links/buttons
  const linkVariants = {
    hover: {
      scale: 1.1,
      transition: { type: 'spring', stiffness: 300, damping: 10 },
      color: '#4B0082', // Indigo-600
    },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
  };

  // Animation for mobile menu
  const menuVariants = {
    open: { opacity: 1, height: 'auto', transition: { duration: 0.3 } },
    closed: { opacity: 0, height: 0, transition: { duration: 0.3 } },
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="w-full px-0">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center ml-16">
            <HashLink to="/#hero" className="text-2xl font-bold text-indigo-600">
              INSA Reading Challenge
            </HashLink>
          </div>

          {/* Desktop Navigation */}
          <div className="flex items-center space-x-6 mr-6 hidden md:flex">
            <HashLink
              to="/#hero"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
                Home
              </motion.span>
            </HashLink>
            <HashLink
              to="/#how-it-works"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
                How It Works
              </motion.span>
            </HashLink>
            <HashLink
              to="/#why-join"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
                Why Join
              </motion.span>
            </HashLink>
            <HashLink
              to="/#explore-books"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
                Explore Books
              </motion.span>
            </HashLink>
            <Link
              to="/leaderboard"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
                Leaderboard
              </motion.span>
            </Link>
            <Link
              to="/public-reviews"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
                Reviews
              </motion.span>
            </Link>
            <Link
              to="/search-quotes"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
                Quotes
              </motion.span>
            </Link>
          </div>

          {/* Login and Register Buttons */}
          <div className="flex items-center mr-24 hidden md:flex">
            <Link
              to="/login"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 mr-4"
            >
              <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
                Login
              </motion.span>
            </Link>
            <Link
              to="/register"
              className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600"
            >
              <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
                Register
              </motion.span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className="md:hidden overflow-hidden"
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={menuVariants}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <HashLink
            to="/#hero"
            className="block text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium"
            onClick={toggleMenu}
          >
<motion.span
  variants={linkVariants}
  whileHover="hover"
  whileTap="tap"
  className="relative"
>
  Home
  <motion.span
    className="absolute left-0 -bottom-1 w-full h-[2px] bg-indigo-600 origin-left"
    initial={{ scaleX: 0 }}
    whileHover={{ scaleX: 1 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  />
</motion.span>


          </HashLink>
          <HashLink
            to="/#how-it-works"
            className="block text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium"
            onClick={toggleMenu}
          >
            <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
              How It Works
            </motion.span>
          </HashLink>
          <HashLink
            to="/#why-join"
            className="block text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium"
            onClick={toggleMenu}
          >
            <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
              Why Join
            </motion.span>
          </HashLink>
          <HashLink
            to="/#explore-books"
            className="block text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium"
            onClick={toggleMenu}
          >
            <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
              Explore Books
            </motion.span>
          </HashLink>
          <Link
            to="/leaderboard"
            className="block text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium"
            onClick={toggleMenu}
          >
            <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
              Leaderboard
            </motion.span>
          </Link>
          <Link
            to="/public-reviews"
            className="block text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium"
            onClick={toggleMenu}
          >
            <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
              Reviews
            </motion.span>
          </Link>
          <Link
            to="/search-quotes"
            className="block text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium"
            onClick={toggleMenu}
          >
            <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
              Quotes
            </motion.span>
          </Link>
          <Link
            to="/login"
            className="block bg-indigo-600 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700"
            onClick={toggleMenu}
          >
            <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
              Login
            </motion.span>
          </Link>
          <Link
            to="/register"
            className="block bg-emerald-500 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-emerald-600"
            onClick={toggleMenu}
          >
            <motion.span variants={linkVariants} whileHover="hover" whileTap="tap">
              Register
            </motion.span>
          </Link>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;
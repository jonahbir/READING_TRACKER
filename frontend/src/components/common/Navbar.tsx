import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

// Navbar component for the INSA Reading Challenge app
const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  // Toggle mobile menu
  const toggleMenu = () => setIsOpen(!isOpen);

  // Custom smooth scroll function
  const smoothScrollTo = (hash: string) => {
    setTimeout(() => {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        const yOffset = -80; // Adjust for navbar height
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 0);
  };

  // Animation variants for links/buttons
  const linkVariants = {
    hover: {
      scale: 1.05,
      transition: { type: 'spring', stiffness: 400, damping: 10 },
      color: '#4B0082',
    },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
  };

  // New animation for border fill effect
  const borderFillVariants = {
    initial: { width: 0, opacity: 0 },
    hover: {
      width: "100%",
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  // Enhanced nav item variant with border effects
  const navItemVariants = {
    initial: { 
      scale: 1,
      boxShadow: "0 0 0 rgba(75, 0, 130, 0)" 
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 25px rgba(75, 0, 130, 0.15)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  // Animation for mobile menu
  const menuVariants = {
    open: { 
      opacity: 1, 
      height: 'auto', 
      transition: { duration: 0.3 } 
    },
    closed: { 
      opacity: 0, 
      height: 0, 
      transition: { duration: 0.3 } 
    },
  };

  // Handle home navigation
  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname !== '/') {
      return;
    } else {
      e.preventDefault();
      smoothScrollTo('hero');
    }
  };

  // Handle section navigation
  const handleSectionClick = (sectionId: string, e: React.MouseEvent) => {
    if (location.pathname !== '/') {
      return;
    } else {
      e.preventDefault();
      smoothScrollTo(sectionId);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  // Mobile menu items data - dynamic based on login status
  const mobileMenuItems = isLoggedIn ? [
    { to: '/posts', label: 'Posts', onClick: toggleMenu },
    { to: '/reading-progress', label: 'Reading Progress', onClick: toggleMenu },
    { to: '/books', label: 'Books', onClick: toggleMenu },
    { to: '/notifications', label: 'Notifications', onClick: toggleMenu },
    { to: '/profile', label: 'Profile', onClick: toggleMenu },
    { to: '/leaderboard', label: 'Leaderboard', onClick: toggleMenu },
  ] : [
    { to: '/#hero', label: 'Home', onClick: handleHomeClick },
    { to: '/#how-it-works', label: 'How It Works', onClick: (e: React.MouseEvent) => handleSectionClick('how-it-works', e) },
    { to: '/#why-join', label: 'Why Join', onClick: (e: React.MouseEvent) => handleSectionClick('why-join', e) },
    { to: '/#explore-books', label: 'Explore Books', onClick: (e: React.MouseEvent) => handleSectionClick('explore-books', e) },
    { to: '/leaderboard', label: 'Leaderboard', onClick: toggleMenu },
    { to: '/reviews', label: 'Reviews', onClick: toggleMenu },
    { to: '/search-quotes', label: 'Quotes', onClick: toggleMenu },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b-2 border-indigo-100">
      <div className="w-full px-0">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center ml-16">
            <Link 
              to="/#hero"
              className="text-2xl font-bold text-indigo-600 relative group"
              onClick={handleHomeClick}
            >
              <motion.span
                className="relative inline-block px-3 py-1"
                whileHover="hover"
                whileTap="tap"
                variants={navItemVariants}
              >
                INSA Reading Challenge
                {/* Animated border */}
                <motion.span
                  className="absolute inset-0 border-2 border-indigo-300 rounded-lg opacity-0 group-hover:opacity-100"
                  initial={{ scale: 0.8 }}
                  whileHover={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
                {/* Background fill on hover */}
                <motion.span
                  className="absolute inset-0 bg-indigo-50 rounded-lg -z-10"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="flex items-center space-x-2 mr-6 hidden md:flex">
            {isLoggedIn ? (
              // Logged-in navigation
              <>
                {['posts', 'reading-progress', 'books', 'notifications', 'profile', 'leaderboard'].map((page) => (
                  <Link
                    key={page}
                    to={`/${page}`}
                    className="relative group"
                  >
                    <motion.span
                      className="relative inline-block px-4 py-2 text-gray-700 font-medium rounded-lg"
                      whileHover="hover"
                      whileTap="tap"
                      variants={navItemVariants}
                    >
                      <motion.span variants={linkVariants}>
                        {page.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </motion.span>
                      <motion.span
                        className="absolute bottom-0 left-0 h-0.5 bg-indigo-600 rounded-full"
                        variants={borderFillVariants}
                        initial="initial"
                        whileHover="hover"
                      />
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg -z-10"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.span>
                  </Link>
                ))}
              </>
            ) : (
              // Public navigation
              <>
                {/* Home Link */}
                <Link
                  to="/#hero"
                  className="relative group"
                  onClick={handleHomeClick}
                >
                  <motion.span
                    className="relative inline-block px-4 py-2 text-gray-700 font-medium rounded-lg"
                    whileHover="hover"
                    whileTap="tap"
                    variants={navItemVariants}
                  >
                    <motion.span variants={linkVariants}>
                      Home
                    </motion.span>
                    <motion.span
                      className="absolute bottom-0 left-0 h-0.5 bg-indigo-600 rounded-full"
                      variants={borderFillVariants}
                      initial="initial"
                      whileHover="hover"
                    />
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg -z-10"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.span>
                </Link>

                {/* Section Links */}
                {['how-it-works', 'why-join', 'explore-books'].map((section) => (
                  <Link
                    key={section}
                    to={`/#${section}`}
                    className="relative group"
                    onClick={(e: React.MouseEvent) => handleSectionClick(section, e)}
                  >
                    <motion.span
                      className="relative inline-block px-4 py-2 text-gray-700 font-medium rounded-lg"
                      whileHover="hover"
                      whileTap="tap"
                      variants={navItemVariants}
                    >
                      <motion.span variants={linkVariants}>
                        {section.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </motion.span>
                      <motion.span
                        className="absolute bottom-0 left-0 h-0.5 bg-indigo-600 rounded-full"
                        variants={borderFillVariants}
                        initial="initial"
                        whileHover="hover"
                      />
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg -z-10"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.span>
                  </Link>
                ))}

                {/* Other page links */}
                {['leaderboard', 'reviews', 'search-quotes'].map((page) => (
                  <Link
                    key={page}
                    to={`/${page}`}
                    className="relative group"
                  >
                    <motion.span
                      className="relative inline-block px-4 py-2 text-gray-700 font-medium rounded-lg"
                      whileHover="hover"
                      whileTap="tap"
                      variants={navItemVariants}
                    >
                      <motion.span variants={linkVariants}>
                        {page.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </motion.span>
                      <motion.span
                        className="absolute bottom-0 left-0 h-0.5 bg-indigo-600 rounded-full"
                        variants={borderFillVariants}
                        initial="initial"
                        whileHover="hover"
                      />
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg -z-10"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.span>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center mr-24 hidden md:flex space-x-3">
            {isLoggedIn ? (
              // Logged-in user actions
              <>
                <div className="text-gray-700 font-medium">
                  Welcome, {user?.name}
                </div>
                <motion.button
                  onClick={handleLogout}
                  className="relative group"
                >
                  <motion.span
                    className="relative inline-block px-6 py-2 bg-red-600 text-white font-medium rounded-lg shadow-md"
                    whileHover="hover"
                    whileTap="tap"
                    variants={navItemVariants}
                  >
                    <motion.span variants={linkVariants}>
                      Logout
                    </motion.span>
                    <motion.span
                      className="absolute inset-0 border-2 border-red-400 rounded-lg opacity-0 group-hover:opacity-100"
                      initial={{ scale: 0.9 }}
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.span
                      className="absolute inset-0 bg-red-700 rounded-lg -z-10"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.span>
                </motion.button>
              </>
            ) : (
              // Public user actions
              <>
                <Link
                  to="/login"
                  className="relative group"
                >
                  <motion.span
                    className="relative inline-block px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md"
                    whileHover="hover"
                    whileTap="tap"
                    variants={navItemVariants}
                  >
                    <motion.span variants={linkVariants}>
                      Login
                    </motion.span>
                    <motion.span
                      className="absolute inset-0 border-2 border-indigo-400 rounded-lg opacity-0 group-hover:opacity-100"
                      initial={{ scale: 0.9 }}
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.span
                      className="absolute inset-0 bg-indigo-700 rounded-lg -z-10"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.span>
                </Link>
                
                <Link
                  to="/register"
                  className="relative group"
                >
                  <motion.span
                    className="relative inline-block px-6 py-2 bg-emerald-500 text-white font-medium rounded-lg shadow-md"
                    whileHover="hover"
                    whileTap="tap"
                    variants={navItemVariants}
                  >
                    <motion.span variants={linkVariants}>
                      Register
                    </motion.span>
                    <motion.span
                      className="absolute inset-0 border-2 border-emerald-400 rounded-lg opacity-0 group-hover:opacity-100"
                      initial={{ scale: 0.9 }}
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.span
                      className="absolute inset-0 bg-emerald-600 rounded-lg -z-10"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center mr-4">
            <motion.button
              onClick={toggleMenu}
              className="relative p-2 text-gray-700 hover:text-indigo-600 focus:outline-none rounded-lg"
              whileHover="hover"
              whileTap="tap"
              variants={navItemVariants}
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
              <motion.span
                className="absolute inset-0 border-2 border-indigo-200 rounded-lg opacity-0 hover:opacity-100"
                initial={{ scale: 0.8 }}
                whileHover={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className="md:hidden overflow-hidden bg-white border-t border-indigo-100"
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={menuVariants}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {/* Mobile navigation items with similar effects */}
          {mobileMenuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block relative group px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 font-medium"
              onClick={item.onClick}
            >
              <motion.span
                className="relative inline-block w-full"
                whileHover="hover"
                whileTap="tap"
                variants={linkVariants}
              >
                {item.label}
                <motion.span
                  className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300"
                />
                <motion.span
                  className="absolute inset-0 bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 -z-10 transition-all duration-300"
                />
              </motion.span>
            </Link>
          ))}
          
          {/* Mobile auth buttons */}
          <div className="pt-2 space-y-2 border-t border-gray-200">
            {isLoggedIn ? (
              <>
                <div className="text-center text-gray-700 font-medium py-2">
                  Welcome, {user?.name}
                </div>
                <motion.button
                  onClick={handleLogout}
                  className="block w-full bg-red-600 text-white px-3 py-3 rounded-lg font-medium text-center"
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Logout
                  </motion.span>
                </motion.button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block relative group bg-indigo-600 text-white px-3 py-3 rounded-lg font-medium text-center"
                  onClick={toggleMenu}
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Login
                  </motion.span>
                </Link>
                <Link
                  to="/register"
                  className="block relative group bg-emerald-500 text-white px-3 py-3 rounded-lg font-medium text-center"
                  onClick={toggleMenu}
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Register
                  </motion.span>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;
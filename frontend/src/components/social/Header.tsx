import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotifications, Notification } from '../../api/api';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    setIsLoggedIn(!!token);

    if (token) {
      const fetchNotifications = async () => {
        try {
          const data = await getNotifications();
          setNotifications(data);
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
        }
      };
      fetchNotifications();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <header className="bg-gradient-to-r from-indigo-950 to-black text-white py-4 px-4 sm:px-6 lg:px-8 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/dashboard" className="text-2xl font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
          LibraryApp
        </Link>

        {/* Navigation Links */}
        {isLoggedIn && (
          <nav className="hidden md:flex space-x-6">
            <Link to="/dashboard" className="text-gray-300 hover:text-emerald-500 transition-colors">Dashboard</Link>
            <Link to="/books" className="text-gray-300 hover:text-emerald-500 transition-colors">Books</Link>
            <Link to="/feed" className="text-gray-300 hover:text-emerald-500 transition-colors">Feed</Link>
            <Link to="/leaderboard" className="text-gray-300 hover:text-emerald-500 transition-colors">Leaderboard</Link>
          </nav>
        )}

        {/* Right: Notifications + Profile */}
        {isLoggedIn && (
          <div className="flex items-center space-x-4">
            {/* Notifications Dropdown */}
            <div className="relative">
              <motion.button
                className="relative text-gray-300 hover:text-emerald-500 transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </motion.button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    className="absolute right-0 mt-2 w-64 bg-slate-900 rounded-lg shadow-lg p-4 z-10"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    {notifications.length === 0 ? (
                      <p className="text-gray-300 text-sm">No notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <Link
                          key={notif.id}
                          to={`/feed/${notif.related_post_id || ''}`}
                          className="block text-gray-300 hover:text-emerald-500 text-sm mb-2"
                        >
                          {notif.message}
                        </Link>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <motion.button
                className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                U
              </motion.button>
              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    className="absolute right-0 mt-2 w-48 bg-slate-900 rounded-lg shadow-lg p-4 z-10"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <Link to="/profile" className="block text-gray-300 hover:text-emerald-500 mb-2">Profile</Link>
                    <Link to="/settings" className="block text-gray-300 hover:text-emerald-500 mb-2">Settings</Link>
                    <button
                      onClick={handleLogout}
                      className="block text-gray-300 hover:text-emerald-500 w-full text-left"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
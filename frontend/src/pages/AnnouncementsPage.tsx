import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getAnnouncements, Announcement } from '../api/api';

const AnnouncementsPage: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      loadAnnouncements();
    }
  }, [isLoggedIn]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAnnouncements();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setError('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date not available';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date not available';
    }
  };

  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date not available';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date not available';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 002.828 0l2-2a1 1 0 00-1.414-1.414L11 7.586 8.707 5.293z" clipRule="evenodd" />
          </svg>
        );
      case 'low':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 002.828 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view announcements</h1>
          <p>You need to be logged in to access announcements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Announcements & Upcoming Events
          </h1>
          <p className="text-blue-200">Stay updated with the latest news and events</p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 002.828 0l2-2a1 1 0 00-1.414-1.414L11 7.586 8.707 5.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-200">{error}</p>
              <button
                onClick={loadAnnouncements}
                className="ml-auto text-red-300 hover:text-red-100 underline"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Content - Split Layout */}
        <div className="flex gap-8">
          {/* Left Side - Announcement Details (60% width) */}
          <div className="flex-1 lg:w-3/5">
            {selectedAnnouncement ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-xl"
              >
                {/* Detailed View Header */}
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mr-4 shadow-md ${getPriorityColor(selectedAnnouncement.priority)}`}>
                      {getPriorityIcon(selectedAnnouncement.priority)}
                      <span className="ml-1 capitalize">{selectedAnnouncement.priority}</span>
                    </span>
                    <span className="text-blue-200 text-sm font-medium">
                      {formatDate(selectedAnnouncement.created_at)}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {selectedAnnouncement.title}
                  </h2>
                </div>

                {/* Detailed Content */}
                <div className="mb-8">
                  <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                    {selectedAnnouncement.content}
                  </p>
                </div>

                {/* Detailed Footer */}
                <div className="flex items-center justify-between border-t border-white/20 pt-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {(selectedAnnouncement.author_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <p className="text-white font-semibold text-lg">{selectedAnnouncement.author_name || 'Administrator'}</p>
                      <p className="text-blue-200 text-sm font-medium">{selectedAnnouncement.author_name || 'Administrator'}</p>
                    </div>
                  </div>
                </div>

                {/* Mini Preview Card Below */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(selectedAnnouncement.priority)}`}>
                      {getPriorityIcon(selectedAnnouncement.priority)}
                      <span className="ml-1 capitalize">{selectedAnnouncement.priority}</span>
                    </span>
                    <span className="text-blue-200 text-xs">
                      {formatShortDate(selectedAnnouncement.created_at)}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{selectedAnnouncement.title}</h3>
                  <p className="text-blue-200 text-sm">{truncateText(selectedAnnouncement.content, 80)}</p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-12 border border-white/20 shadow-xl text-center"
              >
                <div className="text-6xl mb-6">📢</div>
                <h2 className="text-2xl font-bold text-white mb-4">Stay Updated</h2>
                <p className="text-blue-200 text-lg mb-6">
                  Click on any announcement from the list to view the full details here.
                </p>
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <p className="text-blue-300 italic">
                    "Knowledge is power, but enthusiasm pulls the switch."
                  </p>
                  <p className="text-blue-400 text-sm mt-2">- Steve Dahl</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Side - Announcements List (40% width) */}
          <div className="w-full lg:w-2/5">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Loading announcements...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center text-white">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
                    <svg className="w-16 h-16 text-blue-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM9 6v10a1 1 0 102 0V6a1 1 0 10-2 0zm4 0v10a1 1 0 102 0V6a1 1 0 10-2 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2">No announcements yet</h3>
                    <p className="text-blue-200">
                      Check back later for updates and important information.
                    </p>
                  </div>
                </div>
              ) : (
                announcements.map((announcement, index) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 border cursor-pointer transition-all duration-300 hover:bg-white/15 hover:scale-105 ${
                      selectedAnnouncement?.id === announcement.id 
                        ? 'border-blue-400 bg-white/15' 
                        : 'border-white/20'
                    }`}
                  >
                    {/* List Item Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(announcement.priority)}`}>
                        {getPriorityIcon(announcement.priority)}
                        <span className="ml-1 capitalize">{announcement.priority}</span>
                      </span>
                      <span className="text-blue-200 text-xs">
                        {formatShortDate(announcement.created_at)}
                      </span>
                    </div>

                    {/* List Item Content */}
                    <h3 className="text-white font-semibold mb-2 line-clamp-2">
                      {announcement.title}
                    </h3>
                    <p className="text-blue-200 text-sm mb-3 line-clamp-3">
                      {truncateText(announcement.content, 120)}
                    </p>

                    {/* List Item Footer */}
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {(announcement.author_name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-2 text-blue-200 text-xs font-medium">
                        {announcement.author_name || 'Administrator'}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Refresh Button */}
            {!loading && announcements.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mt-6"
              >
                <motion.button
                  onClick={loadAnnouncements}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Refresh Announcements
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
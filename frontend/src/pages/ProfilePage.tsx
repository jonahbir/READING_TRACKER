import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, changePassword } from '../api/api';
import { useParams, useNavigate } from 'react-router-dom';

interface UserProfile {
  name: string;
  reader_id: string;
  class_tag: string;
  rank_score: number;
  books_read: number;
  badges: string[];
  borrow_history: BorrowHistoryEntry[];
  email?: string;
  dorm_number?: string;
  insa_batch?: string;
  educational_status?: string;
}

interface BorrowHistoryEntry {
  book_title: string;
  borrow_date: string;
  return_date: string;
  returned: boolean;
}

const ProfilePage: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (isLoggedIn) {
      loadProfile();
    }
  }, [isLoggedIn, userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await getUserProfile(userId);
      setProfile(profileData);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Close modal after success
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRankColor = (rankScore: number) => {
    if (rankScore >= 100) return 'from-yellow-400 to-yellow-600';
    if (rankScore >= 50) return 'from-purple-400 to-purple-600';
    if (rankScore >= 25) return 'from-blue-400 to-blue-600';
    return 'from-gray-400 to-gray-600';
  };

  const getRankTitle = (rankScore: number) => {
    if (rankScore >= 100) return 'Master Reader';
    if (rankScore >= 50) return 'Advanced Reader';
    if (rankScore >= 25) return 'Active Reader';
    return 'Beginner Reader';
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view profiles</h1>
          <p>You need to be logged in to access user profiles.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="mb-4">{error || 'The requested profile could not be found.'}</p>
          <motion.button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Back
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-32 h-32 bg-gradient-to-r ${getRankColor(profile.rank_score)} rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg`}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                <div className={`w-8 h-8 bg-gradient-to-r ${getRankColor(profile.rank_score)} rounded-full flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{profile.name}</h1>
                  <p className="text-blue-200 text-lg mb-2">@{profile.reader_id}</p>
                </div>
                
                {/* Change Password Button - Only show on own profile */}
                {isOwnProfile && (
                  <motion.button
                    onClick={() => setShowChangePassword(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-4 md:mt-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Change Password
                  </motion.button>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-4">
                <span className={`px-4 py-2 bg-gradient-to-r ${getRankColor(profile.rank_score)} text-white rounded-full font-semibold`}>
                  {getRankTitle(profile.rank_score)}
                </span>
                <span className="px-4 py-2 bg-white/20 text-white rounded-full font-semibold">
                  {profile.class_tag}
                </span>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{profile.rank_score}</div>
                  <div className="text-blue-200 text-sm">Rank Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{profile.books_read}</div>
                  <div className="text-blue-200 text-sm">Books Read</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{profile.badges.length}</div>
                  <div className="text-blue-200 text-sm">Badges</div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information (only for own profile) */}
          {isOwnProfile && (profile.email || profile.dorm_number || profile.insa_batch || profile.educational_status) && (
            <div className="mt-8 pt-8 border-t border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.email && (
                  <div>
                    <h4 className="font-semibold text-blue-200">Email</h4>
                    <p className="text-white">{profile.email}</p>
                  </div>
                )}
                {profile.dorm_number && (
                  <div>
                    <h4 className="font-semibold text-blue-200">Dorm Number</h4>
                    <p className="text-white">{profile.dorm_number}</p>
                  </div>
                )}
                {profile.insa_batch && (
                  <div>
                    <h4 className="font-semibold text-blue-200">INSA Batch</h4>
                    <p className="text-white">{profile.insa_batch}</p>
                  </div>
                )}
                {profile.educational_status && (
                  <div>
                    <h4 className="font-semibold text-blue-200">Educational Status</h4>
                    <p className="text-white">{profile.educational_status}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-b from-blue-900 to-black border border-white/20 rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Change Password</h2>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                    setPasswordForm({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                    {passwordSuccess}
                  </div>
                )}

                <div>
                  <label htmlFor="current_password" className="block text-blue-200 text-sm font-semibold mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current_password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label htmlFor="new_password" className="block text-blue-200 text-sm font-semibold mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new_password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-blue-200 text-sm font-semibold mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordError(null);
                      setPasswordSuccess(null);
                      setPasswordForm({
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                      });
                    }}
                    className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={changingPassword}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                      changingPassword
                        ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    whileHover={!changingPassword ? { scale: 1.02 } : {}}
                    whileTap={!changingPassword ? { scale: 0.98 } : {}}
                  >
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Badges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Achievements & Badges</h2>
          {profile.badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profile.badges.map((badge, index) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 rounded-lg p-4 text-center hover:bg-white/20 transition-colors"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-sm">{badge}</h3>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <p className="text-blue-200">No badges earned yet</p>
              <p className="text-blue-300 text-sm mt-2">
                {isOwnProfile ? 'Keep reading to earn your first badge!' : 'This user hasn\'t earned any badges yet.'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Borrow History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            {isOwnProfile ? 'Your Borrow History' : 'Borrow History'}
          </h2>
          {profile.borrow_history.length > 0 ? (
            <div className="space-y-4">
              {profile.borrow_history.map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/10 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{entry.book_title}</h3>
                    <p className="text-blue-200 text-sm">
                      Borrowed: {formatDate(entry.borrow_date)}
                      {entry.returned && ` • Returned: ${formatDate(entry.return_date)}`}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    entry.returned 
                      ? 'bg-green-600 text-white' 
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {entry.returned ? 'Returned' : 'Active'}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-blue-200">No borrow history</p>
              <p className="text-blue-300 text-sm mt-2">
                {isOwnProfile ? 'Start borrowing books to build your history!' : 'This user hasn\'t borrowed any books yet.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
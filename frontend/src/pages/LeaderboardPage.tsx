import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getLeaderboard, getUserProfile } from './../api/api';
import { useAuth } from '../context/AuthContext';

interface Leader {
  reader_id: string;
  name: string;
  rank_score: number;
  books_read: number;
  class_tag: string;
}

// Professional Icons
const RankIcons = {
  1: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  2: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  3: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  book: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
    </svg>
  ),
  trophy: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L9 11.414V15a1 1 0 102 0v-3.586l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  ),
  academic: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
    </svg>
  ),
  trending: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
    </svg>
  ),
  arrowUp: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  ),
  sad: (
    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
    </svg>
  )
};

const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<Leader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'top10' | 'sameClass'>('all');
  const [showClassMessage, setShowClassMessage] = useState(false);
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboard();
        console.log('Fetched leaderboard data:', data);
        setLeaders(data);

        if (isLoggedIn && user) {
          const userIndex = data.findIndex(leader => leader.reader_id === user.reader_id);
          if (userIndex !== -1) {
            setUserRank(userIndex + 1);
            setUserStats(data[userIndex]);
          } else {
            setUserRank(data.length + 1);
            try {
              const userProfile = await getUserProfile();
              setUserStats({
                reader_id: user.reader_id,
                name: user.name,
                rank_score: userProfile.rank_score || 0,
                books_read: userProfile.books_read || 0,
                class_tag: userProfile.class_tag || 'N/A'
              });
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
          }
        }
      } catch (error: any) {
        console.error('Fetch error:', error.message);
        setError(error.message || 'Error loading leaderboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isLoggedIn, user]);

  const handleClassFilterClick = () => {
    if (!isLoggedIn) {
      setShowClassMessage(true);
    } else {
      setActiveFilter('sameClass');
    }
  };

  const handleFilterClick = (filter: 'all' | 'top10' | 'sameClass') => {
    if (filter === 'sameClass' && !isLoggedIn) {
      handleClassFilterClick();
    } else {
      setActiveFilter(filter);
    }
  };

  const getFilteredLeaders = () => {
    switch (activeFilter) {
      case 'top10':
        return leaders.slice(0, 10);
      case 'sameClass':
        return isLoggedIn && user 
          ? leaders.filter(leader => leader.class_tag === user.class_tag)
          : leaders;
      default:
        return leaders;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-400 to-gray-600';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    if (rank <= 10) return 'from-purple-500 to-purple-700';
    return 'from-blue-500 to-blue-700';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return RankIcons[1];
    if (rank === 2) return RankIcons[2];
    if (rank === 3) return RankIcons[3];
    if (rank <= 10) return RankIcons.star;
    return RankIcons.book;
  };

  const getProgressPercentage = (rankScore: number) => {
    const maxScore = leaders[0]?.rank_score || 100;
    return Math.min((rankScore / maxScore) * 100, 100);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    },
    hover: {
      scale: 1.05,
      color: '#93c5fd',
      transition: { duration: 0.3 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-400 text-xl mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-400 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  const filteredLeaders = getFilteredLeaders();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black">
      {/* Funny Message Modal for Non-Logged-In Users */}
      {showClassMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setShowClassMessage(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-gradient-to-br from-blue-800 via-blue-900 to-purple-900 border-2 border-yellow-400 rounded-3xl p-10 max-w-lg w-full mx-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-yellow-400 mb-4 flex justify-center">
                {RankIcons.sad}
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 leading-tight">
                Oops! Classroom Access Required 🎓
              </h3>
              <div className="space-y-4">
                <p className="text-blue-100 text-lg leading-relaxed">
                  Looks like you're trying to peek into a classroom, but you're not enrolled yet!
                </p>
                <p className="text-blue-200 leading-relaxed">
                  Don't worry — it's easy to join our reading community and get your own class ranking!
                </p>
              </div>
            </div>
            
            <div className="space-y-4 mt-8">
              <Link
                to="/register"
                className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 text-lg text-center shadow-lg"
                onClick={() => setShowClassMessage(false)}
              >
                Join Now & Get Your Class! 🚀
              </Link>
              
              <Link
                to="/login"
                className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 text-lg text-center shadow-lg"
                onClick={() => setShowClassMessage(false)}
              >
                Already Have an Account? Login Here! 😊
              </Link>
              
              <button
                onClick={() => setShowClassMessage(false)}
                className="block w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 text-lg text-center shadow-lg"
              >
                Maybe Later — Just Exploring 👀
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center"
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={titleVariants}
          >
            {RankIcons.trophy}
            <span className="mx-4">Reading Champions</span>
            {RankIcons.trophy}
          </motion.h1>
          <p className="text-blue-200 text-lg mb-6">
            Discover the most dedicated readers in our community
          </p>

          {/* User Stats Card for Logged-in Users */}
          {isLoggedIn && userStats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 max-w-2xl mx-auto border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${getRankColor(userRank || 999)} rounded-full flex items-center justify-center text-white font-bold text-xl`}>
                    {userRank}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl flex items-center">
                      {RankIcons.trending}
                      <span className="ml-2">Your Position</span>
                    </h3>
                    <p className="text-blue-200">Keep reading to climb higher!</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-2xl flex items-center justify-end">
                    {userStats.rank_score}
                    {RankIcons.arrowUp}
                  </div>
                  <div className="text-blue-200 text-sm">Rank Score</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-blue-200 text-sm mb-2">
                  <span>Your Progress</span>
                  <span>{Math.round(getProgressPercentage(userStats.rank_score))}% of #1</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage(userStats.rank_score)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8 space-x-4"
        >
          {['all', 'top10', 'sameClass'].map((filter) => (
            <motion.button
              key={filter}
              onClick={() => handleFilterClick(filter as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filter === 'all' && <>{RankIcons.users}<span>All Readers</span></>}
              {filter === 'top10' && <>{RankIcons.star}<span>Top 10</span></>}
              {filter === 'sameClass' && <>{RankIcons.academic}<span>Your Class</span></>}
            </motion.button>
          ))}
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
              {RankIcons.users}
              <span className="ml-2">{leaders.length}</span>
            </div>
            <div className="text-blue-200">Total Readers</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
              {RankIcons.book}
              <span className="ml-2">{leaders.reduce((sum, leader) => sum + leader.books_read, 0)}</span>
            </div>
            <div className="text-blue-200">Books Read</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
              {RankIcons.chart}
              <span className="ml-2">{leaders.reduce((sum, leader) => sum + leader.rank_score, 0)}</span>
            </div>
            <div className="text-blue-200">Total Points</div>
          </div>
        </motion.div>

        {/* Leaderboard Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {filteredLeaders.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-blue-200 text-xl">No readers found for this filter</div>
            </div>
          ) : (
            filteredLeaders.map((leader, index) => (
              <motion.div
                key={leader.reader_id}
                variants={itemVariants}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 transition-all duration-300 ${
                  leader.reader_id === user?.reader_id
                    ? 'border-yellow-400 shadow-lg shadow-yellow-400/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
                whileHover={{ 
                  scale: 1.02, 
                  y: -5,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getRankColor(index + 1)} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {index + 1}
                  </div>
                  <div className="text-yellow-400">
                    {getRankIcon(index + 1)}
                  </div>
                </div>

                {/* Reader Info */}
                <h3 className="text-white font-semibold text-xl mb-2 truncate">
                  {leader.name || 'Anonymous Reader'}
                </h3>
                <p className="text-blue-200 text-sm mb-3">@{leader.reader_id}</p>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 flex items-center">
                      {RankIcons.chart}
                      <span className="ml-2">Rank Score</span>
                    </span>
                    <span className="text-white font-semibold">{leader.rank_score}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 flex items-center">
                      {RankIcons.book}
                      <span className="ml-2">Books Read</span>
                    </span>
                    <span className="text-white font-semibold">{leader.books_read}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 flex items-center">
                      {RankIcons.academic}
                      <span className="ml-2">Class</span>
                    </span>
                    <span className="text-white font-semibold">{leader.class_tag || 'N/A'}</span>
                  </div>
                </div>

                {/* Achievement Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {leader.rank_score >= 100 && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-200 rounded-full text-xs flex items-center">
                      {RankIcons.star}
                      <span className="ml-1">Elite</span>
                    </span>
                  )}
                  {leader.books_read >= 10 && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-200 rounded-full text-xs flex items-center">
                      {RankIcons.book}
                      <span className="ml-1">Voracious</span>
                    </span>
                  )}
                  {index < 3 && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-200 rounded-full text-xs flex items-center">
                      {RankIcons.trophy}
                      <span className="ml-1">Top 3</span>
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Call to Action - Different for logged in vs public */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          {!isLoggedIn ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-2xl mx-auto border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
                {RankIcons.trending}
                <span className="ml-2">Ready to Join the Challenge?</span>
              </h3>
              <p className="text-blue-200 mb-6">
                Start your reading journey today and climb the leaderboard!
              </p>
              <Link
                to="/register"
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="flex items-center">
                  {RankIcons.book}
                  <span className="ml-2">Start Reading Journey</span>
                </motion.span>
              </Link>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-2xl mx-auto border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
                {RankIcons.arrowUp}
                <span className="ml-2">Keep Climbing!</span>
              </h3>
              <p className="text-blue-200 mb-4">
                Every book you read brings you closer to the top. Stay consistent and watch your rank soar!
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  to="/books"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  {RankIcons.book}
                  <span>Browse Books</span>
                </Link>
                <Link
                  to="/reading-progress"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  {RankIcons.chart}
                  <span>Track Progress</span>
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;
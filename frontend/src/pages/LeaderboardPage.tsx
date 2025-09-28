import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getLeaderboard } from './../api/api'; // Adjust path as needed

const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<Array<{
    reader_id: string;
    name: string;
    rank_score: number;
    books_read: number;
    class_tag: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        console.log('Fetched leaderboard data:', data); // Debug: Check console
        setLeaders(data);
      } catch (error: any) {
        console.error('Fetch error:', error.message); // Debug: Check console
        setError(error.message || 'Error loading leaderboard. Check console for details.');
      }
    };

    fetchLeaderboard();
  }, []);

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

  const cardVariants = {
    hover: {
      scale: 1.05,
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.4)', // Darker shadow for contrast
      transition: { type: 'spring', stiffness: 250, damping: 15 },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
    hover: {
      scale: 1.05,
      color: '#a5b4fc', // Lighter indigo for hover
      transition: { duration: 0.3 },
    },
  };

  if (error) return <div className="py-20 text-center text-red-500 text-xl">{error}</div>;

  return (
    <section id="leaderboard" className="py-20 bg-gradient-to-b from-indigo-950 to-indigo-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-white mb-12 text-center tracking-tight"
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
          viewport={{ once: true }}
          variants={titleVariants}
        >
          Top Readers
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {leaders.length === 0 ? (
            <p className="text-center text-gray-300 col-span-full">No leaderboard data available.</p>
          ) : (
            leaders.map((leader, index) => (
              <motion.div
                key={leader.reader_id} // Ensure unique key
                className="bg-indigo-800 p-6 rounded-lg shadow-lg text-center cursor-pointer hover:shadow-xl transition-shadow duration-300"
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-indigo-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{index + 1}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{leader.name || 'Unknown'}</h3>
                <p className="text-gray-200 mb-2 font-medium">Rank Score: {leader.rank_score || 0}</p>
                <p className="text-gray-200 mb-2">Books Read: {leader.books_read || 0}</p>
                <p className="text-sm text-gray-300">{leader.class_tag || 'N/A'}</p>
              </motion.div>
            ))
          )}
        </motion.div>
        <div className="mt-12 text-center">
          <Link
            to="/register"
            className="inline-block bg-emerald-500 text-white px-6 py-3 rounded-md hover:bg-emerald-600 transition-colors duration-300"
          >
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              Join Now
            </motion.span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Leaderboard;
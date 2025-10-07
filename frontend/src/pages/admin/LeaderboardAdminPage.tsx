import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getLeaderboard } from '../../api/api';

const StatsCard: React.FC<{ title: string; value: string | number; icon: string }> = ({ title, value, icon }) => (
  <motion.div
    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 flex-1"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="text-white/70 text-sm font-medium">{title}</div>
      <span className={`text-2xl`}>{icon}</span>
    </div>
    <div className="text-white font-bold text-xl">{value}</div>
  </motion.div>
);

const LeaderboardAdminPage: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLeaderboard();
        setEntries(data);
        setFilteredEntries(data);
      } catch (e: any) {
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const filtered = entries.filter((e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.reader_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  const totalEntries = entries.length;
  const topReader = entries[0];
  const avgBooks = entries.reduce((sum, e) => sum + e.books_read, 0) / (entries.length || 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-650 via-blue-900 to-black p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-650 via-blue-900 to-black p-6 pt-10 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-white text-3xl font-bold mb-2">🏆 Leaderboard</h1>
            <p className="text-white/70">Manage and view top readers across classes</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats Row */}
        {totalEntries > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Total Readers"
              value={totalEntries}
              icon="👥"
            />
            <StatsCard
              title="Top Reader"
              value={topReader ? topReader.name : 'N/A'}
              icon="🥇"
            />
            <StatsCard
              title="Avg Books Read"
              value={avgBooks.toFixed(1)}
              icon="📚"
            />
          </div>
        )}

        {/* Leaderboard Grid */}
        <div className="space-y-4">
          <h2 className="text-white text-xl font-semibold">Top Performers</h2>
          {error ? (
            <div className="text-red-300 text-center py-12">{error}</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-white/50 text-center py-12">
              <p className="text-2xl mb-4">📭 No readers found</p>
              <p>Try adjusting your search or refresh the page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntries.map((e, i) => {
                const rank = i + 1;
                const isTop3 = rank <= 3;
                const medalColor = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : 'text-orange-500';
                return (
                  <motion.div
                    key={e.reader_id || i}
                    className={`rounded-xl p-6 bg-white/10 border border-white/20 hover:bg-white/15 transition-all cursor-pointer relative overflow-hidden group ${
                      isTop3 ? 'ring-2 ring-purple-400/50' : ''
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    {isTop3 && (
                      <div className={`absolute -top-2 -right-2 p-2 rounded-full bg-purple-600/20 ${medalColor}`}>
                        <span className="text-lg font-bold">#{rank}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-white font-bold text-lg">{e.name}</div>
                      <div className={`text-sm font-medium ${isTop3 ? medalColor : 'text-white/70'}`}>
                        #{rank}
                      </div>
                    </div>
                    <div className="text-white/70 text-sm mb-3">ID: {e.reader_id}</div>
                    <div className="grid grid-cols-3 gap-4 text-white/80 mb-4">
                      <div className="text-center">
                        <div className="text-xs opacity-70">Class</div>
                        <div className="font-medium text-purple-300">{e.class_tag}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs opacity-70">Books Read</div>
                        <div className="font-medium text-emerald-300">{e.books_read}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs opacity-70">Score</div>
                        <div className="font-medium text-cyan-300">{e.rank_score}</div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 text-xs">
                        {e.class_tag} Champion
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        {totalEntries > 0 && (
          <motion.div
            className="text-center text-white/50 text-sm pt-8 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Leaderboard updated in real-time • {totalEntries} active readers
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardAdminPage;
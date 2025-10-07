import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants, LayoutGroup } from 'framer-motion';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { UsersIcon, CheckIcon, ClockIcon, BookOpenIcon, EyeIcon, ArrowPathIcon, TrophyIcon, DocumentIcon } from '@heroicons/react/24/outline';
import {
  UserIcon,
  BookOpenIcon as BookIcon,
  ClockIcon as ClockBookIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  ChatBubbleOvalLeftIcon,
  ChartBarIcon,
  MegaphoneIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

// Updated interfaces to match full backend response
interface PendingRegistration {
  id: string;
  email: string;
  reader_id: string;
  name: string;
  insa_batch: string;
  dorm_number: string;
  educational_status: string;
  submitted_at: string;
}

interface TopReader {
  id: string;
  name: string;
  email: string;
  reader_id: string;
  role: string;
  insa_batch: string;
  dorm_number: string;
  educational_status: string;
  verified: boolean;
  books_read: number;
  rank_score: number;
  class_tag: string;
  created_at: string;
  must_change_password: boolean;
}

interface PopularBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  type: string;
  physical_location: string;
  phone_number_of_the_handler: string;
  softcopy_url: string;
  available: boolean;
  about_the_book: string;
  total_pages: number;
  created_at: string;
  count: number;
}

interface TopReview {
  id: string;
  review_text: string;
  ai_check_status: string;
  ai_score: number;
  posted: boolean;
  upvotes: number;
  created_at: string;
  book_title: string;
  reviewer_name: string;
  reader_id: string;
}

interface TopQuote {
  id: string;
  text: string;
  upvotes: number;
  created_at: string;
  author_name: string;
}

interface Comment {
  id: string;
  text: string;
  upvotes: number;
  created_at: string;
  author_name: string;
}

interface BadgeDistribution {
  type: string;
  count: number;
}

interface PendingBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  type: string;
  physical_location: string;
  phone_number_of_the_handler: string;
  softcopy_url: string;
  about_the_book: string;
  total_pages: number;
  submitted_by_name: string;
  submitted_by_reader_id: string;
  submitted_at: string;
  status: string;
  rejection_reason?: string;
}

interface AnalyticsResponse {
  users: {
    total_users: number;
    verified_users: number;
    pending_registrations: number;
    pending_registrations_list: PendingRegistration[];
    top_readers_by_books: TopReader[];
    top_readers_by_rank: TopReader[];
  };
  books: {
    total_books: number;
    available_books: number;
    hardcopy_books: number;
    softcopy_books: number;
    total_borrows: number;
    total_completions: number;
    popular_books_by_borrows: PopularBook[];
    popular_books_by_completions: PopularBook[];
  };
  reading: {
    avg_reading_time_hours: number;
    total_progress_entries: number;
    avg_pages_read: number;
  };
  social: {
    total_reviews: number;
    total_quotes: number;
    total_review_comments: number;
    total_quote_comments: number;
    top_reviews: TopReview[];
    top_quotes: TopQuote[];
    top_review_comments: Comment[];
    top_quote_comments: Comment[];
  };
  badges: {
    total_badges: number;
    badge_distribution: BadgeDistribution[];
  };
  pending_books: {
    total_pending_books: number;
    pending_books_list: PendingBook[];
  };
  announcements: {
    total_announcements: number;
    active_announcements: number;
  };
  notifications: {
    total_notifications: number;
    unseen_notifications: number;
  };
  generated_at: string;
}

const useCounter = (target: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
    return () => {
      startTime = null;
    };
  }, [target, duration]);

  return count;
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      duration: 0.6,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.3,
    },
  },
};

const Card: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = 'blue' }) => {
  const numericValue = typeof value === 'number' ? value : 0;
  const count = useCounter(numericValue);

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl cursor-default select-none relative overflow-hidden"
      variants={itemVariants}
      whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 400 } }}
    >
      <div className="absolute top-4 right-4">{icon}</div>
      <div className="text-sm text-cyan-200 z-10 relative">{title}</div>
      <div className={`text-3xl font-bold mt-2 text-white z-10 relative`}>{count}</div>
    </motion.div>
  );
};

const ExpandableList: React.FC<{ items: any[]; renderItem: (item: any, idx: number) => React.ReactNode; title: string; showLimit?: number }> = ({ items, renderItem, title, showLimit = 3 }) => {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? items : items.slice(0, showLimit);

  return (
    <LayoutGroup>
      <motion.h3
        className="text-white text-lg font-semibold mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {title}
      </motion.h3>
      <AnimatePresence>
        <motion.div className="space-y-2 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {displayItems.map((item, idx) => (
            <motion.div
              key={`${title}-${idx}`}
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              {renderItem(item, idx)}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      {items.length > showLimit && (
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="text-cyan-300 hover:text-cyan-100 text-sm font-medium transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {expanded ? 'Show Less' : `Show More (${items.length - showLimit} more)`}
        </motion.button>
      )}
    </LayoutGroup>
  );
};

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalUser, setModalUser] = useState<TopReader | null>(null);
  const [modalBook, setModalBook] = useState<PopularBook | null>(null);
  const [modalPendingReg, setModalPendingReg] = useState<PendingRegistration | null>(null);
  const [modalPendingBook, setModalPendingBook] = useState<PendingBook | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('jwtToken') || '';
        const res = await fetch('http://localhost:8080/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const json: AnalyticsResponse = await res.json();
        setData(json);
        setError(null);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Modal close handler
  const closeModal = () => {
    setModalUser(null);
    setModalBook(null);
    setModalPendingReg(null);
    setModalPendingBook(null);
  };

  // Helper to format date
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  if (loading) {
    return (
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-blue-950 to-black text-white p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-gray-900 mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-lg font-semibold">Loading analytics...</p>
      </motion.div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-blue-950 to-black p-4">
        <p className="text-red-400 font-semibold text-center">{error || 'No data found.'}</p>
      </div>
    );
  }

  // Extract core metrics
  const { users, books, social, reading, badges, pending_books, announcements, notifications, generated_at } = data;

  // Pie chart data for book types
  const pieData = {
    labels: ['Hardcopy', 'Softcopy'],
    datasets: [
      {
        data: [books.hardcopy_books, books.softcopy_books],
        backgroundColor: ['#3B82F6', '#1F2937'],
        borderWidth: 2,
        borderColor: '#1E293B',
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#E5E7EB',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FFFFFF',
        bodyColor: '#E5E7EB',
      },
    },
    maintainAspectRatio: false,
  };

  // Line chart data for borrows over time (sample data)
  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Borrows',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#E5E7EB',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FFFFFF',
        bodyColor: '#E5E7EB',
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#E5E7EB',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#E5E7EB',
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-650 via-blue-900 to-black p-6 pt-10 relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
      </div>

      {/* Top Charts Section - Pie and Line */}
      <motion.section
        className="relative z-10 mb-10 max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl"
            variants={itemVariants}
          >
            <h2 className="text-white text-xl font-semibold mb-4 flex items-center"><ChartBarIcon className="h-5 w-5 mr-2 text-blue-400" /> Book Types Distribution</h2>
            <div className="h-64">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </motion.div>
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl"
            variants={itemVariants}
          >
            <h2 className="text-white text-xl font-semibold mb-4 flex items-center"><ArrowPathIcon className="h-5 w-5 mr-2 text-indigo-400" /> Borrows Over Time</h2>
            <div className="h-64">
              <Line data={lineData} options={lineOptions} />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Top Cards Section - Expanded */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card title="Total Users" value={users.total_users} icon={<UsersIcon className="h-8 w-8 text-blue-400" />} />
        <Card title="Verified Users" value={users.verified_users} icon={<CheckIcon className="h-8 w-8 text-green-400" />} />
        <Card title="Pending Regs" value={users.pending_registrations} icon={<ClockIcon className="h-8 w-8 text-yellow-400" />} />
        <Card title="Total Books" value={books.total_books} icon={<BookOpenIcon className="h-8 w-8 text-purple-400" />} />
        <Card title="Available Books" value={books.available_books} icon={<EyeIcon className="h-8 w-8 text-cyan-400" />} />
        <Card title="Total Borrows" value={books.total_borrows} icon={<ArrowPathIcon className="h-8 w-8 text-indigo-400" />} />
        <Card title="Total Completions" value={books.total_completions} icon={<TrophyIcon className="h-8 w-8 text-amber-400" />} />
        <Card title="Pending Books" value={pending_books.total_pending_books} icon={<DocumentIcon className="h-8 w-8 text-gray-400" />} />
      </motion.div>

      {/* Pending Registrations Section */}
      <motion.section
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl mb-8 relative z-10"
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        animate="visible"
      >
        <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><UserGroupIcon className="h-5 w-5 mr-2 text-yellow-400" />Pending Registrations</h2>
        <ExpandableList
          items={users.pending_registrations_list}
          renderItem={(reg, idx) => (
            <motion.button
              key={idx}
              className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 text-white flex justify-between items-center transition border border-white/10"
              onClick={() => setModalPendingReg(reg)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-medium">{reg.name}</span>
              <span className="text-cyan-300 text-sm">{formatDate(reg.submitted_at)}</span>
            </motion.button>
          )}
          title=""
          showLimit={3}
        />
      </motion.section>

      {/* Analytics Grid - Top Readers & Popular Books */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12 relative z-10">
        {/* Top Readers */}
        <motion.section
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          animate="visible"
        >
          <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><UsersIcon className="h-5 w-5 mr-2 text-blue-400" />Top Readers by Books</h2>
          <ExpandableList
            items={users.top_readers_by_books}
            renderItem={(u, idx) => (
              <motion.button
                key={idx}
                className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 text-white flex justify-between items-center transition border border-white/10"
                onClick={() => setModalUser(u)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{u.name} ({u.class_tag})</span>
                <span className="text-cyan-300 text-sm">Books: {u.books_read} | Score: {u.rank_score}</span>
              </motion.button>
            )}
            title=""
            showLimit={3}
          />
          <h2 className="text-white text-xl font-semibold mt-6 mb-3 flex items-center"><TrophyIcon className="h-5 w-5 mr-2 text-amber-400" />Top Readers by Rank</h2>
          <ExpandableList
            items={users.top_readers_by_rank}
            renderItem={(u, idx) => (
              <motion.button
                key={idx}
                className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 text-white flex justify-between items-center transition border border-white/10"
                onClick={() => setModalUser(u)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{u.name} ({u.class_tag})</span>
                <span className="text-yellow-300 text-sm">Score: {u.rank_score} | Books: {u.books_read}</span>
              </motion.button>
            )}
            title=""
            showLimit={3}
          />
        </motion.section>

        {/* Popular Books */}
        <motion.section
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          animate="visible"
        >
          <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><BookIcon className="h-5 w-5 mr-2 text-purple-400" />Popular by Borrows</h2>
          <ExpandableList
            items={books.popular_books_by_borrows}
            renderItem={(b, idx) => (
              <motion.button
                key={idx}
                className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 text-white flex justify-between items-center transition border border-white/10"
                onClick={() => setModalBook(b)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{b.title} ({b.genre})</span>
                <span className="text-cyan-300 text-sm">Borrows: {b.count} | {b.type}</span>
              </motion.button>
            )}
            title=""
            showLimit={3}
          />
          <h2 className="text-white text-xl font-semibold mt-6 mb-3 flex items-center"><TrophyIcon className="h-5 w-5 mr-2 text-amber-400" />Popular by Completions</h2>
          <ExpandableList
            items={books.popular_books_by_completions}
            renderItem={(b, idx) => (
              <motion.button
                key={idx}
                className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 text-white flex justify-between items-center transition border border-white/10"
                onClick={() => setModalBook(b)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{b.title} ({b.genre})</span>
                <span className="text-yellow-300 text-sm">Comps: {b.count} | {b.type}</span>
              </motion.button>
            )}
            title=""
            showLimit={3}
          />
        </motion.section>
      </div>

      {/* Pending Books Section */}
      <motion.section
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl mb-8 relative z-10"
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        animate="visible"
      >
        <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><ClockBookIcon className="h-5 w-5 mr-2 text-yellow-400" />Pending Books</h2>
        <ExpandableList
          items={pending_books.pending_books_list}
          renderItem={(pb, idx) => (
            <motion.button
              key={idx}
              className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 text-white flex justify-between items-center transition border border-white/10"
              onClick={() => setModalPendingBook(pb)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{pb.title} by {pb.submitted_by_name}</span>
              <span className="text-cyan-300 text-sm">{pb.genre} | {formatDate(pb.submitted_at)}</span>
            </motion.button>
          )}
          title=""
          showLimit={2}
        />
      </motion.section>

      {/* Social Grid - Reviews, Quotes, Comments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 relative z-10">
        <motion.section
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          animate="visible"
        >
          <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><ChatBubbleLeftIcon className="h-5 w-5 mr-2 text-green-400" />Reviews</h2>
          <div className="text-cyan-200 mb-3">Total: {social.total_reviews}</div>
          <ExpandableList
            items={social.top_reviews}
            renderItem={(r, idx) => (
              <div key={idx} className="bg-white/5 p-3 rounded-lg mb-2 border border-white/10">
                <div className="text-white font-bold text-sm">{r.book_title}</div>
                <div className="text-cyan-200 text-xs mb-1 italic">"{r.review_text}"</div>
                <div className="text-cyan-400 text-xs">By: {r.reviewer_name} | Up: {r.upvotes} | AI: {r.ai_score.toFixed(1)} | {formatDate(r.created_at)}</div>
              </div>
            )}
            title="Top Reviews"
            showLimit={2}
          />
        </motion.section>
        <motion.section
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          animate="visible"
        >
          <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><BookIcon className="h-5 w-5 mr-2 text-indigo-400" />Quotes</h2>
          <div className="text-cyan-200 mb-3">Total: {social.total_quotes}</div>
          <ExpandableList
            items={social.top_quotes}
            renderItem={(q, idx) => (
              <div key={idx} className="bg-white/5 p-3 rounded-lg mb-2 italic text-cyan-200 border border-white/10">
                "{q.text}"
                <div className="text-cyan-400 text-xs font-normal not-italic mt-1">By: {q.author_name || 'Anonymous'} | Up: {q.upvotes} | {formatDate(q.created_at)}</div>
              </div>
            )}
            title="Top Quotes"
            showLimit={3}
          />
        </motion.section>
        <motion.section
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          animate="visible"
        >
          <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><ChatBubbleOvalLeftIcon className="h-5 w-5 mr-2 text-cyan-400" />Comments</h2>
          <div className="text-cyan-200 mb-3">Review: {social.total_review_comments} | Quote: {social.total_quote_comments}</div>
          <h3 className="text-gray-200 text-sm mb-2">Top Review Comments</h3>
          <ExpandableList
            items={social.top_review_comments.slice(0, 2)}
            renderItem={(c, idx) => (
              <div key={idx} className="bg-white/5 p-2 rounded text-xs mb-1 border border-white/10">
                <div className="text-cyan-300">{c.text}</div>
                <div className="text-cyan-400 text-xs">By: {c.author_name} | Up: {c.upvotes}</div>
              </div>
            )}
            title=""
            showLimit={1}
          />
          <h3 className="text-gray-200 text-sm mt-3 mb-2">Top Quote Comments</h3>
          <ExpandableList
            items={social.top_quote_comments.slice(0, 2)}
            renderItem={(c, idx) => (
              <div key={idx} className="bg-white/5 p-2 rounded text-xs mb-1 border border-white/10">
                <div className="text-cyan-300">{c.text}</div>
                <div className="text-cyan-400 text-xs">By: {c.author_name} | Up: {c.upvotes}</div>
              </div>
            )}
            title=""
            showLimit={1}
          />
        </motion.section>
      </div>

      {/* Reading Stats & Badges & Announcements & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 relative z-10">
        <motion.section
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl md:col-span-1"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          animate="visible"
        >
          <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><ChartBarIcon className="h-5 w-5 mr-2 text-blue-400" />Reading Stats</h2>
          <div className="text-cyan-200 text-sm mb-1">Avg Time: {reading.avg_reading_time_hours.toFixed(1)}h</div>
          <div className="text-cyan-200 text-sm mb-1">Total Entries: {reading.total_progress_entries}</div>
          <div className="text-cyan-200 text-sm">Avg Pages: {reading.avg_pages_read.toFixed(0)}</div>
        </motion.section>
        <motion.section
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl md:col-span-1"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          animate="visible"
        >
          <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><TrophyIcon className="h-5 w-5 mr-2 text-amber-400" />Badges</h2>
          <div className="text-cyan-200 text-sm mb-1">Total: {badges.total_badges}</div>
          <div className="text-gray-200 text-sm">
            Distribution: {badges.badge_distribution.map(b => `${b.type || 'General'} (${b.count})`).join(', ') || 'General badges'}
          </div>
        </motion.section>
        <motion.section
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl md:col-span-1"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          animate="visible"
        >
          <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><MegaphoneIcon className="h-5 w-5 mr-2 text-orange-400" />Announcements</h2>
          <div className="text-cyan-200 text-sm mb-1">Total: {announcements.total_announcements}</div>
          <div className="text-green-300 text-sm">Active: {announcements.active_announcements}</div>
        </motion.section>
        <motion.section
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl md:col-span-1"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          animate="visible"
        >
          <h2 className="text-white text-xl font-semibold mb-3 flex items-center"><BellIcon className="h-5 w-5 mr-2 text-red-400" />Notifications</h2>
          <div className="text-cyan-200 text-sm mb-1">Total: {notifications.total_notifications}</div>
          <div className={`text-${notifications.unseen_notifications > 0 ? 'red' : 'green'}-300 text-sm`}>Unseen: {notifications.unseen_notifications}</div>
        </motion.section>
      </div>

      <div className="text-right text-xs text-cyan-400 mb-12 relative z-10">Data generated at: {new Date(generated_at).toLocaleString()}</div>

      {/* Cool Black Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black py-4 text-center text-cyan-200 font-semibold text-lg select-none shadow-2xl border-t border-white/20 relative z-10">
        📚 Welcome, admin! You are the super-man! Everything is under your control
      </footer>

      {/* User Modal - Enhanced */}
      <AnimatePresence>
        {modalUser && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeModal}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl text-white border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.h3
                className="text-2xl font-bold mb-4 flex items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <UserIcon className="h-6 w-6 mr-2 text-blue-400" />
                {modalUser.name}
              </motion.h3>
              <AnimatePresence>
                <motion.div
                  className="space-y-2 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, staggerChildren: 0.05 }}
                >
                  {[
                    { label: 'Email', value: modalUser.email, color: 'cyan' },
                    { label: 'Reader ID', value: modalUser.reader_id, color: 'cyan' },
                    { label: 'Role', value: modalUser.role, color: 'cyan' },
                    { label: 'INSA Batch', value: modalUser.insa_batch, color: 'cyan' },
                    { label: 'Dorm', value: modalUser.dorm_number, color: 'cyan' },
                    { label: 'Status', value: modalUser.educational_status, color: 'cyan' },
                    { label: 'Verified', value: modalUser.verified ? 'Yes' : 'No', color: 'green' },
                    { label: 'Books Read', value: modalUser.books_read, color: 'yellow' },
                    { label: 'Rank Score', value: modalUser.rank_score, color: 'yellow' },
                    { label: 'Class Tag', value: modalUser.class_tag, color: 'yellow' },
                    { label: 'Joined', value: formatDate(modalUser.created_at), color: 'gray' },
                    { label: 'Must Change PW', value: modalUser.must_change_password ? 'Yes' : 'No', color: 'gray' },
                  ].map((item, idx) => (
                    <motion.p
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <span className={`font-semibold text-${item.color}-300`}>{item.label}:</span> {item.value}
                    </motion.p>
                  ))}
                </motion.div>
              </AnimatePresence>
              <motion.button
                onClick={closeModal}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Similar enhancements for other modals... */}
      {/* Book Modal - Enhanced */}
      <AnimatePresence>
        {modalBook && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeModal}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl text-white border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.h3
                className="text-2xl font-bold mb-4 flex items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <BookIcon className="h-6 w-6 mr-2 text-purple-400" />
                {modalBook.title}
              </motion.h3>
              <AnimatePresence>
                <motion.div
                  className="space-y-2 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, staggerChildren: 0.05 }}
                >
                  {[
                    { label: 'Author', value: modalBook.author, color: 'cyan' },
                    { label: 'ISBN', value: modalBook.isbn, color: 'cyan' },
                    { label: 'Genre', value: modalBook.genre, color: 'cyan' },
                    { label: 'Type', value: modalBook.type, color: 'cyan' },
                    { label: 'Available', value: modalBook.available ? 'Yes' : 'No', color: 'green' },
                    ...(modalBook.physical_location ? [{ label: 'Location', value: modalBook.physical_location, color: 'yellow' }] : []),
                    ...(modalBook.phone_number_of_the_handler ? [{ label: 'Handler Phone', value: modalBook.phone_number_of_the_handler, color: 'yellow' }] : []),
                    ...(modalBook.softcopy_url ? [{ label: 'Softcopy', value: <a href={modalBook.softcopy_url} className="underline">Link</a>, color: 'yellow' }] : []),
                    { label: 'Pages', value: modalBook.total_pages, color: 'yellow' },
                    { label: 'About', value: modalBook.about_the_book, color: 'gray', small: true },
                    { label: 'Count', value: modalBook.count, color: 'orange' },
                    { label: 'Added', value: formatDate(modalBook.created_at), color: 'gray' },
                  ].map((item, idx) => (
                    <motion.p
                      key={idx}
                      className={item.small ? 'text-xs' : ''}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <span className={`font-semibold text-${item.color}-300`}>{item.label}:</span> {typeof item.value === 'string' ? item.value : item.value}
                    </motion.p>
                  ))}
                </motion.div>
              </AnimatePresence>
              <motion.button
                onClick={closeModal}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Reg Modal - Enhanced similarly */}
      <AnimatePresence>
        {modalPendingReg && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeModal}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl text-white border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.h3
                className="text-2xl font-bold mb-4 flex items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ClockIcon className="h-6 w-6 mr-2 text-yellow-400" />
                {modalPendingReg.name}
              </motion.h3>
              <AnimatePresence>
                <motion.div
                  className="space-y-2 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, staggerChildren: 0.05 }}
                >
                  {[
                    { label: 'Email', value: modalPendingReg.email, color: 'cyan' },
                    { label: 'Reader ID', value: modalPendingReg.reader_id, color: 'cyan' },
                    { label: 'INSA Batch', value: modalPendingReg.insa_batch, color: 'cyan' },
                    { label: 'Dorm', value: modalPendingReg.dorm_number, color: 'cyan' },
                    { label: 'Status', value: modalPendingReg.educational_status, color: 'cyan' },
                    { label: 'Submitted', value: formatDate(modalPendingReg.submitted_at), color: 'gray' },
                  ].map((item, idx) => (
                    <motion.p
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <span className={`font-semibold text-${item.color}-300`}>{item.label}:</span> {item.value}
                    </motion.p>
                  ))}
                </motion.div>
              </AnimatePresence>
              <motion.button
                onClick={closeModal}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Book Modal - Enhanced similarly */}
      <AnimatePresence>
        {modalPendingBook && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeModal}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl text-white border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.h3
                className="text-2xl font-bold mb-4 flex items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <BookIcon className="h-6 w-6 mr-2 text-purple-400" />
                {modalPendingBook.title}
              </motion.h3>
              <AnimatePresence>
                <motion.div
                  className="space-y-2 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, staggerChildren: 0.05 }}
                >
                  {[
                    { label: 'Author', value: modalPendingBook.author, color: 'cyan' },
                    { label: 'ISBN', value: modalPendingBook.isbn, color: 'cyan' },
                    { label: 'Genre', value: modalPendingBook.genre, color: 'cyan' },
                    { label: 'Type', value: modalPendingBook.type, color: 'cyan' },
                    ...(modalPendingBook.physical_location ? [{ label: 'Location', value: modalPendingBook.physical_location, color: 'yellow' }] : []),
                    ...(modalPendingBook.phone_number_of_the_handler ? [{ label: 'Handler Phone', value: modalPendingBook.phone_number_of_the_handler, color: 'yellow' }] : []),
                    ...(modalPendingBook.softcopy_url ? [{ label: 'Softcopy', value: <a href={modalPendingBook.softcopy_url} className="underline">Link</a>, color: 'yellow' }] : []),
                    { label: 'Pages', value: modalPendingBook.total_pages, color: 'yellow' },
                    { label: 'About', value: modalPendingBook.about_the_book, color: 'gray', small: true },
                    { label: 'Submitted By', value: `${modalPendingBook.submitted_by_name} (${modalPendingBook.submitted_by_reader_id})`, color: 'cyan' },
                    { label: 'Status', value: modalPendingBook.status, color: 'orange' },
                    ...(modalPendingBook.rejection_reason ? [{ label: 'Reason', value: modalPendingBook.rejection_reason, color: 'red', small: true }] : []),
                    { label: 'Submitted', value: formatDate(modalPendingBook.submitted_at), color: 'gray' },
                  ].map((item, idx) => (
                    <motion.p
                      key={idx}
                      className={item.small ? 'text-xs' : ''}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <span className={`font-semibold text-${item.color}-300`}>{item.label}:</span> {typeof item.value === 'string' ? item.value : item.value}
                    </motion.p>
                  ))}
                </motion.div>
              </AnimatePresence>
              <motion.button
                onClick={closeModal}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
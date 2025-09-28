import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getNotifications } from './../api/api';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null); // Properly type the error state

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (error: any) { // Type the error parameter
        console.error('Failed to fetch notifications:', error);
        setError(error.message || 'Error loading notifications.');
      }
    };
    fetchNotifications();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  if (error) return <div className="py-20 text-center text-red-500 text-xl">{error}</div>;

  return (
    <section className="py-20 bg-gradient-to-b from-indigo-950 to-black min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-white mb-12 text-center tracking-tight"
          initial="hidden"
          whileInView="visible"
          whileHover={{ scale: 1.05, color: '#10b981' }}
          viewport={{ once: true }}
        >
          Notifications
        </motion.h2>
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {notifications.length === 0 ? (
            <p className="text-center text-gray-300">No notifications available.</p>
          ) : (
            notifications.map((notif, index) => (
              <motion.div
                key={index}
                className="bg-slate-900 p-6 rounded-lg shadow-lg mb-4"
                variants={itemVariants}
              >
                <Link
                  to={`/feed/${notif.related_post_id || ''}`}
                  className="text-gray-300 hover:text-emerald-500"
                >
                  {notif.message}
                </Link>
                <p className="text-gray-300 text-sm mt-2">{new Date(notif.created_at).toLocaleString()}</p>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Notifications;
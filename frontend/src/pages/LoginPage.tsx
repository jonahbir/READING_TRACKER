import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser, getUserProfile } from './../api/api';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    try {
      const response = await loginUser({ email, password });
      setToken(response.token);
      
      // Fetch user profile after successful login
      const userProfile = await getUserProfile();
      setUser({
        id: userProfile.reader_id,
        name: userProfile.name,
        email: userProfile.email || email,
        reader_id: userProfile.reader_id,
        role: 'student', // Default role, could be extracted from token if needed
        rank_score: userProfile.rank_score,
        books_read: userProfile.books_read,
        class_tag: userProfile.class_tag
      });
      
      setSuccess('Login successful! Redirecting to Posts...');
      // Redirect to Posts page after successful login
      setTimeout(() => navigate('/posts'), 1500);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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
      color: '#a5b4fc',
      transition: { duration: 0.3 },
    },
  };

  return (
    <section className="py-20 bg-gradient-to-b from-indigo-950 to-indigo-900 min-h-screen">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-4xl font-extrabold text-white mb-8 text-center tracking-tight"
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
          viewport={{ once: true }}
          variants={titleVariants}
        >
          Log In
        </motion.h2>
        {error && <div className="mb-4 text-center text-red-400">{error}</div>}
        {success && <div className="mb-4 text-center text-emerald-400">{success}</div>}
        <form onSubmit={handleSubmit} className="bg-indigo-800 p-8 rounded-lg shadow-lg">
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-200 mb-2">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 bg-indigo-900 text-white border border-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-200 mb-2">Password</label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 bg-indigo-900 text-white border border-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white rounded-md transition-colors duration-300 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
            whileHover={!loading ? { scale: 1.05 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </motion.button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-gray-300">
            Don't have an account? <Link to="/register" className="text-indigo-400 hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </section>
  );
};


export default Login;
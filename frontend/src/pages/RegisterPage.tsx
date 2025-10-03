import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { registerUser } from './../api/api';

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [insaBatch, setInsaBatch] = useState<string>('');
  const [dormNumber, setDormNumber] = useState<string>('');
  const [educationalStatus, setEducationalStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password || !name || !insaBatch || !dormNumber || !educationalStatus) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      const response = await registerUser({
        email,
        password,
        name,
        insa_batch: insaBatch,
        dorm_number: dormNumber,
        educational_status: educationalStatus,
      });
      setSuccess("Admin approval pending. You will receive an approval message via the email you provided — please wait.");
      // Redirect to public homepage after 3 seconds
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
      color: '#93c5fd',
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <motion.h2
            className="text-4xl font-bold text-white mb-2 text-center"
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true }}
            variants={titleVariants}
          >
            Join Our Community
          </motion.h2>
          <p className="text-blue-200 text-center mb-8">Create your account to start your reading journey</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6"
            >
              {success}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-blue-200 text-sm font-semibold mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-blue-200 text-sm font-semibold mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-blue-200 text-sm font-semibold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Create a password"
                  required
                />
              </div>

              <div>
                <label htmlFor="insaBatch" className="block text-blue-200 text-sm font-semibold mb-2">
                  INSA Batch
                </label>
                <input
                  type="text"
                  id="insaBatch"
                  value={insaBatch}
                  onChange={(e) => setInsaBatch(e.target.value)}
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your INSA batch"
                  required
                />
              </div>

              <div>
                <label htmlFor="dormNumber" className="block text-blue-200 text-sm font-semibold mb-2">
                  Dorm Number
                </label>
                <input
                  type="text"
                  id="dormNumber"
                  value={dormNumber}
                  onChange={(e) => setDormNumber(e.target.value)}
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your dorm number"
                  required
                />
              </div>

              <div>
                <label htmlFor="educationalStatus" className="block text-blue-200 text-sm font-semibold mb-2">
                  Educational Status
                </label>
                <input
                  type="text"
                  id="educationalStatus"
                  value={educationalStatus}
                  onChange={(e) => setEducationalStatus(e.target.value)}
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your educational status"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  loading
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mt-6"
          >
            <p className="text-blue-200">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-white font-semibold hover:text-blue-200 transition-colors underline"
              >
                Sign in here
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
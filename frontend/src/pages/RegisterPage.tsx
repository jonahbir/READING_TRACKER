import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link from react-router-dom
import { motion } from 'framer-motion';
import { registerUser } from './../api/api'; // Adjust path as needed

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [insaBatch, setInsaBatch] = useState<string>('');
  const [dormNumber, setDormNumber] = useState<string>('');
  const [educationalStatus, setEducationalStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password || !name || !insaBatch || !dormNumber || !educationalStatus) {
      setError('All fields are required.');
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
      setSuccess(response.message);
      // Redirect to login after 2 seconds
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
          Register
        </motion.h2>
        {error && <div className="mb-4 text-center text-red-400">{error}</div>}
        {success && <div className="mb-4 text-center text-emerald-400">{success}</div>}
        <form onSubmit={handleSubmit} className="bg-indigo-800 p-8 rounded-lg shadow-lg">
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-200 mb-2">Name</label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 bg-indigo-900 text-white border border-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
          <div className="mb-4">
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
          <div className="mb-4">
            <label htmlFor="insaBatch" className="block text-gray-200 mb-2">INSA Batch</label>
            <input
              type="text"
              id="insaBatch"
              className="w-full px-4 py-2 bg-indigo-900 text-white border border-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={insaBatch}
              onChange={(e) => setInsaBatch(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="dormNumber" className="block text-gray-200 mb-2">Dorm Number</label>
            <input
              type="text"
              id="dormNumber"
              className="w-full px-4 py-2 bg-indigo-900 text-white border border-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={dormNumber}
              onChange={(e) => setDormNumber(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="educationalStatus" className="block text-gray-200 mb-2">Educational Status</label>
            <input
              type="text"
              id="educationalStatus"
              className="w-full px-4 py-2 bg-indigo-900 text-white border border-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={educationalStatus}
              onChange={(e) => setEducationalStatus(e.target.value)}
              required
            />
          </div>
          <motion.button
            type="submit"
            className="w-full py-3 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Register
          </motion.button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-gray-300">
            Already have an account? <Link to="/login" className="text-indigo-400 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Register;
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { register } from '../api/api';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [insaBatch, setInsaBatch] = useState('');
  const [dormNumber, setDormNumber] = useState('');
  const [educationalStatus, setEducationalStatus] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await register({
        username,
        email,
        password,
        insa_batch: insaBatch,
        dorm_number: dormNumber,
        educational_status: educationalStatus,
      });
      if (data.message === 'Email pending approval') {
        setMessage('Registration successful! Your email is pending approval.');
      } else {
        setToken(data.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold text-black mb-6">Register</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {message && <p className="text-green-500 mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-black mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-black mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-black mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-black mb-1">INSA Batch</label>
          <input
            type="text"
            value={insaBatch}
            onChange={(e) => setInsaBatch(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-black mb-1">Dorm Number</label>
          <input
            type="text"
            value={dormNumber}
            onChange={(e) => setDormNumber(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-black mb-1">Educational Status</label>
          <input
            type="text"
            value={educationalStatus}
            onChange={(e) => setEducationalStatus(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-githubGreen text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          Register
        </button>
      </form>
      <p className="mt-4 text-black">
        Already have an account?{' '}
        <a href="/login" className="text-githubGreen hover:underline">
          Login
        </a>
      </p>
    </div>
  );
};

export default RegisterPage;
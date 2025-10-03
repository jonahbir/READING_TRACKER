import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { forgotPassword, verifyResetCode, resetPassword } from '../api/api';

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await forgotPassword(email);
      setSuccess('If the email exists, a reset code has been sent');
      setStep('code');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await verifyResetCode(email, code);
      setSuccess('Code verified successfully');
      setStep('password');
    } catch (error: any) {
      setError(error.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await resetPassword(email, code, newPassword);
      setSuccess('Password reset successfully! You can now login with your new password.');
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-sm rounded-2xl p-8"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-blue-200">
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'code' && 'Enter the 6-digit code sent to your email'}
            {step === 'password' && 'Enter your new password'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {step === 'email' && (
          <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-200">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-3 bg-white/20 border border-white/30 rounded-lg placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <motion.button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
                  loading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </motion.button>
            </div>

            <div className="text-center">
              <a
                href="/login"
                className="font-medium text-blue-300 hover:text-blue-200 transition-colors"
              >
                Back to Login
              </a>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-blue-200">
                6-Digit Reset Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="mt-1 appearance-none relative block w-full px-3 py-3 bg-white/20 border border-white/30 rounded-lg placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-center text-xl tracking-widest"
                placeholder="000000"
              />
              <p className="mt-2 text-sm text-blue-300">
                Check your email for the 6-digit code
              </p>
            </div>

            <div className="flex space-x-3">
              <motion.button
                type="button"
                onClick={() => setStep('email')}
                className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading || code.length !== 6}
                className={`flex-1 py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
                  loading || code.length !== 6
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                whileHover={!(loading || code.length !== 6) ? { scale: 1.02 } : {}}
                whileTap={!(loading || code.length !== 6) ? { scale: 0.98 } : {}}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </motion.button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-blue-200">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-3 bg-white/20 border border-white/30 rounded-lg placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-200">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-3 bg-white/20 border border-white/30 rounded-lg placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex space-x-3">
              <motion.button
                type="button"
                onClick={() => setStep('code')}
                className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
                  loading
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getUserProfile, changePassword } from '../../api/api';
import { Link } from 'react-router-dom';

const MotionLink = motion(Link);

const Row: React.FC<{ label: string; value?: string | number; className?: string }> = ({ label, value, className = '' }) => (
  <motion.div 
    className={`flex items-center justify-between py-3 border-b border-white/10 last:border-b-0 ${className}`}
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-white/70 text-sm font-medium">{label}</div>
    <div className="text-white/90 font-semibold">{value || '-'}</div>
  </motion.div>
);

const Button: React.FC<{
  children: React.ReactNode;
  to?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  'aria-label'?: string;
}> = ({ children, to, onClick, variant = 'primary', className = '', 'aria-label': ariaLabel }) => {
  const baseClasses = "px-6 py-3 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center";
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white"
  };

  const sharedProps = {
    className: `${baseClasses} ${variantClasses[variant]} ${className}`,
    'aria-label': ariaLabel,
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  };

  if (to) {
    return (
      <MotionLink 
        to={to} 
        {...sharedProps}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      type="button"
      {...sharedProps}
    >
      {children}
    </motion.button>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <motion.div 
    className="rounded-xl p-6 bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h2 className="text-white font-semibold text-xl mb-6 flex items-center">
      <span className="mr-2">👤</span>{title}
    </h2>
    {children}
  </motion.div>
);

const AdminProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await getUserProfile();
        setProfile(me);
      } catch (e: any) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Close modal after success
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-650 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-650 via-blue-900 to-black flex items-center justify-center">
        <div className="text-red-300 text-center">{error}</div>
      </div>
    );
  }

  if (!profile) return null;

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-650 via-blue-900 to-black p-6 pt-10 relative overflow-hidden space-y-8">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-white text-3xl font-bold mb-2">👤 Admin Profile</h1>
            <p className="text-white/70">Manage your admin account details and quick access</p>
          </div>
          <Button variant="primary" onClick={() => window.location.reload()} className="mt-4 sm:mt-0" aria-label="Refresh profile">
            Refresh Profile
          </Button>
        </motion.div>

        {/* Profile Overview Section */}
        <Section title="Profile Overview">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <Row label="Full Name" value={profile.name} />
              <Row label="Email" value={profile.email} />
              <Row label="Reader ID" value={profile.reader_id} />
              <Row label="Role" value="Admin" className="text-emerald-300" />
              <Row label="Joined" value={profile.created_at ? formatDate(profile.created_at) : '-'} />
            </div>
          </div>
        </Section>

        {/* Badges Section */}
        <Section title="Admin Badges">
          <div className="flex flex-wrap gap-3">
            {(profile.badges || []).length > 0 ? (
              profile.badges.map((b: string, i: number) => (
                <motion.span
                  key={i}
                  className="px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm border border-white/20 shadow-md"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                >
                  {b}
                </motion.span>
              ))
            ) : (
              <p className="text-white/60 text-sm italic">No badges earned yet.</p>
            )}
          </div>
        </Section>

        {/* Quick Actions Section */}
        <Section title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button to="/admin/dashboard" variant="primary" className="w-full" aria-label="Go to dashboard">
              Dashboard
            </Button>
            <Button to="/admin/moderation" variant="secondary" className="w-full" aria-label="Go to moderation">
              Moderation
            </Button>
            <Button to="/admin/leaderboard" variant="secondary" className="w-full" aria-label="Go to leaderboard">
              Leaderboard
            </Button>
          </div>
          <div className="mt-6 text-center">
            <Button variant="secondary" onClick={() => setShowChangePassword(true)} className="px-8" aria-label="Change password">
              Change Password
            </Button>
          </div>
        </Section>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-blue-900 to-black border border-white/20 rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Change Password</h2>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setPasswordForm({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                  });
                }}
                className="text-blue-200 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label htmlFor="current_password" className="block text-blue-200 text-sm font-semibold mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="current_password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label htmlFor="new_password" className="block text-blue-200 text-sm font-semibold mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="new_password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-blue-200 text-sm font-semibold mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                    setPasswordForm({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={changingPassword}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    changingPassword
                      ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  whileHover={!changingPassword ? { scale: 1.02 } : {}}
                  whileTap={!changingPassword ? { scale: 0.98 } : {}}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminProfilePage;
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { approveUser, addAdmin, searchUsersAdmin } from '../../api/api';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <motion.div 
    className="rounded-xl p-6 bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h2 className="text-white font-semibold text-xl mb-4 flex items-center">
      <span className="mr-2">👥</span>{title}
    </h2>
    {children}
  </motion.div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    {...props} 
    className={`w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all border border-white/10 ${props.className || ''}`} 
  />
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'emerald';
  className?: string;
}> = ({ children, onClick, type = 'button', variant = 'primary', className = '' }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center space-x-2";
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white"
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const UserCard: React.FC<{
  user: any;
  onViewDetails?: (user: any) => void;
  onApprove?: (email: string) => void;
}> = ({ user, onViewDetails, onApprove }) => (
  <motion.div
    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl cursor-pointer relative overflow-hidden group"
    whileHover={{ scale: 1.02, y: -5 }}
    onClick={() => onViewDetails && onViewDetails(user)}
  >
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
      {onApprove && (
        <Button variant="emerald" className="text-sm px-2 py-1" onClick={(e) => { e.stopPropagation(); onApprove(user.email); }}>
          Approve
        </Button>
      )}
    </div>
    <h3 className="text-white font-bold text-lg mb-2 truncate">{user.name}</h3>
    <p className="text-cyan-300 mb-1">Reader ID: {user.reader_id}</p>
    <p className="text-gray-300 text-sm mb-2">Email: {user.email}</p>
    <div className="flex justify-between items-center mb-3">
      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300`}>
        Pending
      </span>
      <span className="text-gray-400 text-sm">Batch: {user.insa_batch}</span>
    </div>
    {user.dorm_number && (
      <p className="text-gray-300 text-sm italic opacity-0 group-hover:opacity-100 transition-opacity">
        Dorm: {user.dorm_number}
      </p>
    )}
  </motion.div>
);

const UserModal: React.FC<{
  user: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl text-white border border-white/20 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-2">👤</span>{user.name}
          </h3>
          <div className="space-y-3 text-sm">
            <p><span className="font-semibold text-cyan-300">Email:</span> {user.email}</p>
            <p><span className="font-semibold text-cyan-300">Reader ID:</span> {user.reader_id}</p>
            <p><span className="font-semibold text-cyan-300">INSA Batch:</span> {user.insa_batch}</p>
            <p><span className="font-semibold text-cyan-300">Dorm Number:</span> {user.dorm_number}</p>
            <p><span className="font-semibold text-cyan-300">Educational Status:</span> {user.educational_status}</p>
            <p><span className="font-semibold text-cyan-300">Submitted:</span> {new Date(user.submitted_at).toLocaleDateString()}</p>
            <p><span className="font-semibold text-yellow-300">Status:</span> Pending</p>
          </div>
          <Button onClick={onClose} className="mt-6 w-full" variant="secondary">
            Close
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ConfirmModal: React.FC<{
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ email, isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 max-w-md w-full shadow-2xl text-white border border-white/20"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h3 className="text-xl font-bold mb-4 text-center">Approve User?</h3>
          <p className="text-gray-300 mb-6 text-center">Are you sure you want to approve the user with email: <span className="text-cyan-300">{email}</span>?</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onConfirm} variant="emerald" className="px-6">
              Yes, Approve
            </Button>
            <Button onClick={onClose} variant="secondary" className="px-6">
              Cancel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const UsersPage: React.FC = () => {
  const [search, setSearch] = useState<{ name?: string; insa_batch?: string; dorm_number?: string }>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailApprove, setEmailApprove] = useState('');
  const [admin, setAdmin] = useState({ name: '', email: '', password: '' });

  const pendingMemo = useMemo(() => pendingUsers, [pendingUsers]);
  const searchMemo = useMemo(() => searchResults, [searchResults]);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('jwtToken') || '';
      const response = await fetch('http://localhost:8080/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAnalytics(data);
      setPendingUsers(data.users.pending_registrations_list || []);
    } catch (e: any) {
      console.error('Failed to load analytics:', e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await searchUsersAdmin(search);
      setSearchResults(res.users || []);
    } catch (e: any) {
      console.error('Search failed:', e);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Search failed. Please try again.';
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handleApproveClick = (email: string) => {
    setConfirmEmail(email);
    setShowConfirmModal(true);
  };

  const handleConfirmApprove = async () => {
    try {
      await approveUser(confirmEmail);
      loadAnalytics();
      setShowConfirmModal(false);
      setConfirmEmail('');
      // Custom success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'User approved successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
    } catch (e: any) {
      // Custom error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = e.message || 'Failed to approve user. Please try again.';
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 5000);
    }
  };

  const onApproveByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailApprove) return;
    handleApproveClick(emailApprove);
    setEmailApprove('');
  };

  const onAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin.name || !admin.email || !admin.password) return;
    try {
      await addAdmin(admin);
      setAdmin({ name: '', email: '', password: '' });
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Admin created successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
    } catch (e: any) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = e.message || 'Failed to create admin. Please try again.';
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 5000);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-650 via-blue-900 to-black p-4 sm:p-6 pt-10 relative overflow-hidden space-y-6 sm:space-y-8">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative z-10">
        {/* Static Stats Section - Using Analytics */}
        <Section title="User Statistics">
          {analytics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-cyan-300">{analytics.users.total_users}</div>
                <div className="text-gray-400 text-sm">Total Users</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-yellow-300">{analytics.users.pending_registrations}</div>
                <div className="text-gray-400 text-sm">Pending Approvals</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-emerald-300">{analytics.users.verified_users}</div>
                <div className="text-gray-400 text-sm">Verified Users</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-purple-300">{analytics.books.total_books}</div>
                <div className="text-gray-400 text-sm">Total Books</div>
              </div>
            </div>
          ) : (
            <div className="text-white text-center py-6">Loading statistics...</div>
          )}
        </Section>

        {/* Search Users */}
        <Section title="Search Verified Users">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <Input 
              placeholder="Name" 
              value={search.name || ''} 
              onChange={(e) => setSearch((s) => ({ ...s, name: e.target.value.trim() }))} 
              onKeyDown={handleKeyDown}
            />
            <Input 
              placeholder="INSA Batch" 
              value={search.insa_batch || ''} 
              onChange={(e) => setSearch((s) => ({ ...s, insa_batch: e.target.value.trim() }))} 
              onKeyDown={handleKeyDown}
            />
            <Input 
              placeholder="Dorm Number" 
              value={search.dorm_number || ''} 
              onChange={(e) => setSearch((s) => ({ ...s, dorm_number: e.target.value.trim() }))} 
              onKeyDown={handleKeyDown}
            />
            <Button type="submit" variant="primary" className="w-full md:w-auto">
              Search
            </Button>
          </form>
          {loading ? (
            <div className="text-white text-center py-6">Loading...</div>
          ) : searchMemo.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {searchMemo.map((user) => (
                <motion.div
                  key={user.id || user.email}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-white font-bold text-lg mb-2">{user.name}</h3>
                  <p className="text-cyan-300 mb-1">Class: {user.class_tag}</p>
                  <p className="text-gray-300 text-sm mb-2">Books Read: {user.books_read}</p>
                  <p className="text-gray-300 text-sm">Rank Score: {user.rank_score}</p>
                </motion.div>
              ))}
            </div>
          ) : search.name || search.insa_batch || search.dorm_number ? (
            <p className="text-gray-400 text-center py-4">No users found.</p>
          ) : null}
        </Section>

        {/* Pending Users */}
        <Section title="Pending User Approvals">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pendingMemo.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onViewDetails={setSelectedUser}
                onApprove={handleApproveClick}
              />
            ))}
          </div>
          {pendingMemo.length === 0 && <p className="text-gray-400 text-center py-4">No pending users.</p>}
        </Section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Approve by Email */}
          <Section title="Quick Approve by Email">
            <form onSubmit={onApproveByEmail} className="space-y-3 max-w-md">
              <Input placeholder="User Email *" value={emailApprove} onChange={(e) => setEmailApprove(e.target.value)} required />
              <Button type="submit" variant="emerald" className="w-full">
                Approve User
              </Button>
            </form>
          </Section>

          {/* Add Admin */}
          <Section title="Add New Admin">
            <form onSubmit={onAddAdmin} className="space-y-3 max-w-md">
              <Input placeholder="Name *" value={admin.name} onChange={(e) => setAdmin((s) => ({ ...s, name: e.target.value }))} required />
              <Input placeholder="Email *" type="email" value={admin.email} onChange={(e) => setAdmin((s) => ({ ...s, email: e.target.value }))} required />
              <Input placeholder="Password *" type="password" value={admin.password} onChange={(e) => setAdmin((s) => ({ ...s, password: e.target.value }))} required />
              <Button type="submit" variant="primary" className="w-full">
                Create Admin
              </Button>
            </form>
          </Section>
        </div>
      </div>

      <UserModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />
      <ConfirmModal
        email={confirmEmail}
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmApprove}
      />
    </div>
  );
};

export default UsersPage;
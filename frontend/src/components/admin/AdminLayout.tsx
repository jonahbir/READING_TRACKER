import React, { useState, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, Bars3Icon, ChartBarIcon, BookOpenIcon, ClockIcon, UsersIcon, ChatBubbleLeftIcon, TrophyIcon, MegaphoneIcon, UserIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const navItemBase = "flex items-center gap-3 px-4 py-3 rounded-md text-base font-semibold hover:bg-blue-500/10 hover:border-blue-500/20 transition-all duration-300 text-gray-100 border border-transparent";

const AdminLayout: React.FC<AdminLayoutProps> = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    // Force a full reload to clear any in-memory state and ensure redirect feels "logged out"
    window.location.href = '/';
  };

  const toggleCollapsed = () => setCollapsed(!collapsed);
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  const sidebarVariants = {
    expanded: { width: 288 },
    collapsed: { width: 64 }
  };

  const labelVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  const headerVariants = {
    expanded: { opacity: 1, scale: 1 },
    collapsed: { opacity: 0, scale: 0 }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-b from-gray-900 via-blue-950 to-black text-gray-100 relative overflow-hidden">
      {/* Full-screen gradient overlay to ensure seamless transition under sidebar/header */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-blue-950 to-black z-0" />
      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <motion.aside 
          layout
          variants={sidebarVariants}
          initial={false}
          animate={collapsed ? "collapsed" : "expanded"}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="hidden md:flex flex-col border-r border-blue-500/20 bg-gradient-to-b from-gray-900/95 via-blue-950/95 to-black/95 z-20"
        >
          <div className="flex items-center justify-between px-4 py-5">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  variants={headerVariants}
                  initial={false}
                  animate={collapsed ? "collapsed" : "expanded"}
                  exit="collapsed"
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-bold tracking-wide text-blue-100"
                >
                  Admin
                </motion.span>
              )}
            </AnimatePresence>
            <button onClick={toggleCollapsed} className="p-1 rounded-md hover:bg-blue-500/10 transition-colors">
              {collapsed ? <Bars3Icon className="h-5 w-5 text-blue-300" /> : <XMarkIcon className="h-5 w-5 text-blue-300" />}
            </button>
          </div>
          <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
            <NavLink to="/admin" end className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''} ${collapsed ? 'justify-center' : 'justify-start'}`}>
              <ChartBarIcon className="h-5 w-5 flex-shrink-0 text-blue-300" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    variants={labelVariants}
                    initial={false}
                    animate={collapsed ? "collapsed" : "expanded"}
                    exit="collapsed"
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    Dashboard
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
            <div>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    variants={headerVariants}
                    initial={false}
                    animate={collapsed ? "collapsed" : "expanded"}
                    exit="collapsed"
                    transition={{ duration: 0.2 }}
                    className="px-4 py-2 text-xs uppercase tracking-wider text-blue-400"
                  >
                    Book Management
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                <NavLink to="/admin/books" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''} ${collapsed ? 'justify-center' : 'justify-start'}`}>
                  <BookOpenIcon className="h-5 w-5 flex-shrink-0 text-blue-300" />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        variants={labelVariants}
                        initial={false}
                        animate={collapsed ? "collapsed" : "expanded"}
                        exit="collapsed"
                        transition={{ duration: 0.2, delay: 0.1 }}
                      >
                        Library View
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </div>
            </div>
            <NavLink to="/admin/users" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''} ${collapsed ? 'justify-center' : 'justify-start'}`}>
              <UsersIcon className="h-5 w-5 flex-shrink-0 text-blue-300" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    variants={labelVariants}
                    initial={false}
                    animate={collapsed ? "collapsed" : "expanded"}
                    exit="collapsed"
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    User Management
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
            <NavLink to="/admin/moderation" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''} ${collapsed ? 'justify-center' : 'justify-start'}`}>
              <ChatBubbleLeftIcon className="h-5 w-5 flex-shrink-0 text-green-300" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    variants={labelVariants}
                    initial={false}
                    animate={collapsed ? "collapsed" : "expanded"}
                    exit="collapsed"
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    Reviews & Quotes
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
            <NavLink to="/admin/leaderboard" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''} ${collapsed ? 'justify-center' : 'justify-start'}`}>
              <TrophyIcon className="h-5 w-5 flex-shrink-0 text-amber-300" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    variants={labelVariants}
                    initial={false}
                    animate={collapsed ? "collapsed" : "expanded"}
                    exit="collapsed"
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    Leaderboard
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
            <NavLink to="/admin/announcements" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''} ${collapsed ? 'justify-center' : 'justify-start'}`}>
              <MegaphoneIcon className="h-5 w-5 flex-shrink-0 text-orange-300" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    variants={labelVariants}
                    initial={false}
                    animate={collapsed ? "collapsed" : "expanded"}
                    exit="collapsed"
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    Announcements
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
            <NavLink to="/admin/profile" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''} ${collapsed ? 'justify-center' : 'justify-start'}`}>
              <UserIcon className="h-5 w-5 flex-shrink-0 text-blue-300" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    variants={labelVariants}
                    initial={false}
                    animate={collapsed ? "collapsed" : "expanded"}
                    exit="collapsed"
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    Admin Profile
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          </nav>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                variants={headerVariants}
                initial={false}
                animate={collapsed ? "collapsed" : "expanded"}
                exit="collapsed"
                transition={{ duration: 0.2 }}
                className="px-4 py-4 text-xs text-blue-400"
              >
                Reading Challenge
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" 
              onClick={toggleMobile}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.aside 
                className="w-72 h-screen bg-gradient-to-b from-gray-900/95 via-blue-950/95 to-black/95 border-r border-blue-500/20 absolute right-0"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-5">
                  <span className="text-2xl font-bold tracking-wide text-blue-100">Admin</span>
                  <button onClick={toggleMobile} className="p-1 rounded-md hover:bg-blue-500/10 transition-colors">
                    <XMarkIcon className="h-5 w-5 text-blue-300" />
                  </button>
                </div>
                <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                  <NavLink to="/admin" end className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''}`} onClick={toggleMobile}>
                    <ChartBarIcon className="h-5 w-5 text-blue-300" />
                    <span>Dashboard</span>
                  </NavLink>
                  <div>
                    <div className="px-4 py-2 text-xs uppercase tracking-wider text-blue-400">Book Management</div>
                    <div className="space-y-1">
                      <NavLink to="/admin/books" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''}`} onClick={toggleMobile}>
                        <BookOpenIcon className="h-5 w-5 text-blue-300" />
                        <span>Library View</span>
                      </NavLink>
                    </div>
                  </div>
                  <NavLink to="/admin/users" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''}`} onClick={toggleMobile}>
                    <UsersIcon className="h-5 w-5 text-blue-300" />
                    <span>User Management</span>
                  </NavLink>
                  <NavLink to="/admin/moderation" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''}`} onClick={toggleMobile}>
                    <ChatBubbleLeftIcon className="h-5 w-5 text-green-300" />
                    <span>Reviews & Quotes</span>
                  </NavLink>
                  <NavLink to="/admin/leaderboard" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''}`} onClick={toggleMobile}>
                    <TrophyIcon className="h-5 w-5 text-amber-300" />
                    <span>Leaderboard</span>
                  </NavLink>
                  <NavLink to="/admin/announcements" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''}`} onClick={toggleMobile}>
                    <MegaphoneIcon className="h-5 w-5 text-orange-300" />
                    <span>Announcements</span>
                  </NavLink>
                  <NavLink to="/admin/profile" className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-blue-500/15 border-blue-500/30' : ''}`} onClick={toggleMobile}>
                    <UserIcon className="h-5 w-5 text-blue-300" />
                    <span>Admin Profile</span>
                  </NavLink>
                </nav>
                <div className="px-4 py-4 text-xs text-blue-400">Reading Challenge</div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main */}
        <div className="flex-1 relative z-10 flex flex-col" ref={mainContentRef}>
          {/* Top bar - Seamless gradient blend with content */}
          <header className="sticky top-0 z-40 bg-gradient-to-r from-gray-900/95 via-blue-950/80 to-gray-900/95 border-b border-blue-500/20 flex-shrink-0">
            <div className="flex items-center justify-between px-4 md:px-6 py-3">
              <button onClick={toggleMobile} className="md:hidden inline-flex items-center px-3 py-2 bg-white/10 rounded-md">
                <Bars3Icon className="h-5 w-5 text-gray-100" />
              </button>
              <div className="flex-1 max-w-xl mx-4">
                <div className="text-white font-semibold text-lg">Welcome, Admin!</div>
                <div className="text-gray-300 text-sm">Manage your dashboard and access all admin tools</div>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/admin/profile" className="px-3 py-2 rounded-md bg-white/10 hover:bg-blue-500/10">
                  <UserIcon className="h-5 w-5 text-gray-300" />
                </Link>
                <button onClick={handleLogout} className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-gray-100 transition-colors" title="Logout">
                  <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-8 text-[17px] leading-relaxed overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
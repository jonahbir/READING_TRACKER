import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import AdminLayout from './components/admin/AdminLayout';
import { AdminGuard, DashboardPage, BooksPage as AdminBooksPage, UsersPage as AdminUsersPage, ModerationPage as AdminModerationPage, LeaderboardAdminPage as AdminLeaderboardPage, AdminProfilePage as AdminProfile, AdminAnnouncementsPage as AdminAnnouncements } from './pages/admin';
import Footer from './components/common/Footer';
import { AuthProvider } from './context/AuthContext';

import ExploreBooks from './components/sections/ExploreBooks';

import Leaderboard from './pages/LeaderboardPage';
import Register from './pages/RegisterPage';
import Login from './pages/LoginPage';
import PublicReviews from './pages/PublicReviewsPage';
import PublicQuotes from './pages/PublicQuotesPage';
import HomePage from './pages/HomePage';

// New logged-in pages
import PostsPage from './pages/PostsPage';
import ReadingProgressPage from './pages/ReadingProgressPage';
import BooksPage from './pages/BooksPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SubmitBookPage from './pages/SubmitBookPage';
const AppShell: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!isAdminRoute && <Navbar />}
         
          <main className="flex-grow relative">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/Home" element={<HomePage />} />
              <Route path="/explore-books" element={<ExploreBooks />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reviews" element={<PublicReviews />} />
              <Route path="/search-quotes" element={<PublicQuotes />} />
              
              {/* Logged-in user routes */}
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/submit-book" element={<SubmitBookPage />} />
              <Route path="/posts" element={<PostsPage />} />
              <Route path="/reading-progress" element={<ReadingProgressPage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />

              {/* Admin routes */}
              <Route element={<AdminGuard />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="books" element={<AdminBooksPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="moderation" element={<AdminModerationPage />} />
                  <Route path="leaderboard" element={<AdminLeaderboardPage />} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                  
                </Route>
              </Route>
            </Routes>
          </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
};

export default App;



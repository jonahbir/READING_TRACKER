import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
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
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar />
         
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
              <Route path="/posts" element={<PostsPage />} />
              <Route path="/reading-progress" element={<ReadingProgressPage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;



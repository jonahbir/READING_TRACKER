import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Hero from './components/sections/Hero';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PublicReviewsPage from './pages/PublicReviewsPage';
import SearchQuotesPage from './pages/SearchQuotesPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/public-reviews" element={<PublicReviewsPage />} />
          <Route path="/search-quotes" element={<SearchQuotesPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
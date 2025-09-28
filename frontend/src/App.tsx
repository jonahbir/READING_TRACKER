import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/social/Header';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { BrowserRouter as Router } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ExploreBooks from './components/sections/ExploreBooks';
import Feed from './pages/Feeds';
import Leaderboard from './pages/LeaderboardPage';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Register from './pages/RegisterPage';
import Login from './pages/LoginPage';
import PublicReviews from './pages/PublicReviewsPage';
import PublicQuotes from './pages/PublicQuotesPage';
import HomePage from './pages/HomePage';
const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <Header />
        <main className="flex-grow relative">
        <Routes>
          <Route path="/Home" element={< HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/books" element={<ExploreBooks />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile/:readerId" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reviews" element={<PublicReviews />} />
        <Route path="/search-quotes" element={<PublicQuotes />} />
        <Route path="/" element={<HomePage />} />
         
        </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;



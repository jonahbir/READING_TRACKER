import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getBooks } from '../api/api';
import BookCard from '../components/BookCard';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
}

const HomePage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await getBooks();
        setBooks(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch books');
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold text-black mb-4">
          Track Your Reading Journey
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Join our reading challenge, explore books, and share your progress!
        </p>
        <a
          href="/register"
          className="inline-block bg-githubGreen text-white font-semibold px-6 py-3 rounded hover:bg-green-600 transition"
        >
          Join Reading Challenge
        </a>
      </motion.div>

      {/* Book List */}
      <h2 className="text-3xl font-semibold text-black mb-6">Explore Books</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && books.length === 0 && <p>No books available.</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;
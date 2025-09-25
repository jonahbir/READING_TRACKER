import React from 'react';
import { motion } from 'framer-motion';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
}

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="border border-gray-200 p-4 rounded-lg shadow hover:shadow-md transition"
    >
      <h3 className="text-xl font-semibold text-black">{book.title}</h3>
      <p className="text-gray-600">Author: {book.author}</p>
      <p className="text-gray-600">ISBN: {book.isbn}</p>
      <button
        className="mt-4 bg-githubGreen text-white px-4 py-2 rounded hover:bg-green-600 transition"
        onClick={() => alert(`Borrow ${book.title}`)} // Placeholder
      >
        Borrow
      </button>
    </motion.div>
  );
};

export default BookCard;
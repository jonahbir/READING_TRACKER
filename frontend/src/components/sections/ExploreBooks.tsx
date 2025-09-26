import React from 'react';
import { motion } from 'framer-motion';

// Explore Books section component
const ExploreBooks: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] },
    },
  };

  const cardVariants = {
    hover: { 
      scale: 1.05, 
      boxShadow: '0 10px 20px rgba(75, 0, 130, 0.2)',
      transition: { type: 'spring', stiffness: 250, damping: 15 },
    },
    tap: { 
      scale: 0.98, 
      transition: { duration: 0.1 },
    },
  };

  const books = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { id: 2, title: '1984', author: 'George Orwell' },
    { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee' },
  ];

  return (
    <section id="explore-books" className="py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-indigo-600 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
        >
          Explore Books
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {books.map((book) => (
            <motion.div
              key={book.id}
              className="bg-white p-6 rounded-lg shadow-md text-center cursor-pointer"
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <h3 className="text-xl font-semibold mb-2">{book.title}</h3>
              <p className="text-gray-600">{book.author}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ExploreBooks;
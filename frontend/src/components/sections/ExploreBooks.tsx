import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { getBooks, borrowBook, addSoftToReading, returnBook } from '../../api/api'; // Added returnBook

const ExploreBooks: React.FC = () => {
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>(''); // Added to track user ID

  // Add scroll-based transformations for parallax effect - REMOVED OPACITY
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -80]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.99]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await getBooks();
        setAllBooks(data);
        setFilteredBooks(data);

        // Extract unique genres
        const uniqueGenres: string[] = [];
        data.forEach((book: any) => {
          if (book.Genre && !uniqueGenres.includes(book.Genre)) {
            uniqueGenres.push(book.Genre);
          }
        });
        setGenres(uniqueGenres);

        // Check login status and user ID
        const token = localStorage.getItem('jwtToken');
        setIsLoggedIn(!!token);
        // Assuming userId is stored in localStorage or fetched from profile
        const storedUserId = localStorage.getItem('userId') || ''; // Adjust based on your backend
        setUserId(storedUserId);
      } catch (error: any) {
        setError(error.message || 'Error loading books. Check console for details.');
      }
    };

    fetchBooks();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = allBooks;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (book: any) =>
          book.Title?.toLowerCase().includes(lowerTerm) ||
          book.Author?.toLowerCase().includes(lowerTerm)
      );
    }

    if (selectedGenre !== 'all') {
      filtered = filtered.filter((book: any) => book.Genre === selectedGenre);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((book: any) => book.Type === selectedType);
    }

    setFilteredBooks(filtered);
  }, [searchTerm, selectedGenre, selectedType, allBooks]);

  // Handle borrow or return button click
  const handleBookAction = async (book: any) => {
    if (!isLoggedIn) {
      alert('Please log in to borrow or return a book.');
      return;
    }
    try {
      let response;
      if (book.BorrowedBy === userId && !book.Available) {
        // Return book
        response = await returnBook(book.ISBN);
        alert(response.message);
      } else if (book.Available) {
        // Borrow book
        if (book.Type === 'hardcopy') {
          response = await borrowBook(book.ISBN);
          alert(`Borrowed! Location: ${response.location}, Phone: ${response.phone_number}`);
        } else if (book.Type === 'softcopy') {
          response = await addSoftToReading(book.ISBN);
          alert(response.message);
        }
      }
      // Refresh books
      const updatedBooks = await getBooks();
      setAllBooks(updatedBooks);
      setFilteredBooks(updatedBooks);
    } catch (error: any) {
      alert(error.message || 'Error processing book action.');
    }
  };

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
      scale: 1.08,
      y: -15,
      rotateY: 5,
      boxShadow: '0 25px 50px rgba(75, 0, 130, 0.4)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 10,
        mass: 0.8,
      },
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.2 },
    },
    bounce: {
      y: [0, -20, 0, -10, 0],
      scale: [1, 1.02, 1, 1.01, 1],
      transition: {
        duration: 2,
        ease: 'easeInOut',
        times: [0, 0.2, 0.5, 0.8, 1],
        repeat: Infinity,
        repeatDelay: 3,
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
    hover: {
      scale: 1.05,
      color: '#4B0082',
      transition: { duration: 0.3 },
    },
  };

  const BookIcon = ({ className = "w-16 h-16" }) => (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M42 12H22C18.6863 12 16 14.6863 16 18V46C16 49.3137 18.6863 52 22 52H42C45.3137 52 48 49.3137 48 46V18C48 14.6863 45.3137 12 42 12Z"
        fill="url(#bookGradient)"
        stroke="#4B0082"
        strokeWidth="2"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />
      <path
        d="M42 12V52"
        stroke="#4B0082"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 12V52"
        stroke="#4B0082"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M26 20H38"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M26 28H38"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M26 36H34"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
    </svg>
  );

  const StatusIcon = ({ available, type }: { available: boolean; type: string }) => {
    if (type === 'hardcopy') {
      return available ? (
        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
        </svg>
      ) : (
        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      );
    } else {
      return available ? (
        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      );
    }
  };

  const TypeIcon = ({ type }: { type: string }) => {
    return type === 'hardcopy' ? (
      <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
      </svg>
    ) : (
      <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
      </svg>
    );
  };

  if (error) return <div className="py-20 text-center text-red-500 text-xl">{error}</div>;

  return (
    <motion.section
      id="explore-books"
      className="py-20 bg-gradient-to-b from-gray-200 to-gray-600"
      style={{ y, scale }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-indigo-900 mb-12 cursor-pointer text-center tracking-tight"
          initial="hidden"search-quotes
          whileInView="visible"
          whileHover="hover"
          viewport={{ once: true }}
          variants={titleVariants}
        >
          Explore Our Books
        </motion.h2>

        {/* Filters - Fixed mobile layout */}
        <div className="mb-10 bg-gray-300 p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row justify-center items-stretch md:items-center gap-4">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search by title or author"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 appearance-none bg-white"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <option value="all">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 appearance-none bg-white"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="hardcopy">Hardcopy</option>
                <option value="softcopy">Softcopy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {filteredBooks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              <p className="text-gray-600 text-lg">No books match your filters.</p>
            </div>
          ) : (
            filteredBooks.map((book) => (
              <motion.div
                key={book.ISBN}
                className="bg-white p-6 rounded-xl shadow-lg cursor-pointer border-2 border-transparent hover:border-indigo-200 relative overflow-hidden group"
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                initial="bounce"
                animate="bounce"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-600"></div>
                <motion.div
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.1, rotateY: 10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <BookIcon className="w-20 h-20" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2 text-indigo-900 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                  {book.Title}
                </h3>
                <p className="text-gray-600 mb-2 font-medium">Author: {book.Author}</p>
                <p className="text-sm text-gray-500 mb-2">Genre: {book.Genre}</p>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[3.75rem]">Description: {book.AboutTheBook}</p>
                <div className="mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    book.Type === 'hardcopy'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    <TypeIcon type={book.Type} />
                    {book.Type === 'hardcopy' ? 'Hardcopy' : 'Softcopy'}
                  </span>
                </div>
                <p
                  className={`text-sm font-semibold mb-4 ${
                    book.Available ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  <StatusIcon available={book.Available} type={book.Type} />
                  {book.Available ? 'Available' : 'Borrowed'}
                </p>
                {isLoggedIn ? (
                  <motion.button
                    className={`w-full py-3 px-4 rounded-lg text-white font-semibold relative overflow-hidden ${
                      book.Available || book.BorrowedBy === userId
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    } transition-all duration-300`}
                    whileHover={{
                      scale: book.Available || book.BorrowedBy === userId ? 1.05 : 1,
                      boxShadow: book.Available || book.BorrowedBy === userId ? '0 10px 25px rgba(16, 185, 129, 0.3)' : 'none',
                    }}
                    whileTap={{ scale: book.Available || book.BorrowedBy === userId ? 0.98 : 1 }}
                    onClick={() => (book.Available || book.BorrowedBy === userId) && handleBookAction(book)}
                    disabled={!(book.Available || book.BorrowedBy === userId)}
                  >
                    {book.BorrowedBy === userId && !book.Available ? 'Return' : book.Available ? 'Borrow Now' : 'Unavailable'}
                  </motion.button>
                ) : (
                  <Link
                    to="/register"
                    className="w-full inline-block py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 text-center font-semibold"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {book.Type === 'hardcopy' ? 'Register to Borrow' : 'Register to Read'}
                    </motion.span>
                  </Link>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default ExploreBooks;
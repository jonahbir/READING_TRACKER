import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  getBooks, 
  getBorrowHistory, 
  borrowBook, 
  addSoftToReading,
  getBookReaders
} from '../api/api';

interface Book {
  ID: string;
  Title: string;
  Author: string;
  ISBN: string;
  Genre: string;
  Type: string;
  PhysicalLocation: string;
  PhoneNumberOfTheHandler: string;
  SoftcopyURL: string;
  Available: boolean;
  BorrowedBy: string;
  AddedBy: string;
  CreatedAt: string;
  AboutTheBook: string;
  TotalPages: number;
}

interface BorrowHistoryEntry {
  book_title: string;
  borrow_date: string;
  return_date: string;
  returned: boolean;
}

const BooksPage: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowHistory, setBorrowHistory] = useState<BorrowHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookReaders, setBookReaders] = useState<any[]>([]);
  const [loadingReaders, setLoadingReaders] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hardcopy' | 'softcopy'>('all');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'borrowed'>('all');

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksData, historyData] = await Promise.all([
        getBooks(),
        getBorrowHistory().catch(() => []) // Handle case where user has no borrow history
      ]);
      setBooks(booksData);
      setBorrowHistory(historyData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = async (book: Book) => {
    setSelectedBook(book);
    if (book.Type === 'hardcopy') {
      // Load readers for hardcopy books
      try {
        setLoadingReaders(true);
        const readersData = await getBookReaders(book.ISBN);
        setBookReaders(readersData.active_readers || []);
      } catch (error) {
        console.error('Error loading book readers:', error);
        setBookReaders([]);
      } finally {
        setLoadingReaders(false);
      }
    }
  };

  const handleBorrowBook = async (book: Book) => {
    try {
      setBorrowing(true);
      const result = await borrowBook(book.ISBN);
      alert(`Book borrowed successfully! Location: ${result.location}, Contact: ${result.phone_number}`);
      setSelectedBook(null);
      loadData(); // Reload to update availability
    } catch (error) {
      console.error('Error borrowing book:', error);
      alert('Failed to borrow book. Please try again.');
    } finally {
      setBorrowing(false);
    }
  };

  const handleAddToReading = async (book: Book) => {
    try {
      setBorrowing(true);
      await addSoftToReading(book.ISBN);
      alert('Book added to your reading list!');
      setSelectedBook(null);
    } catch (error) {
      console.error('Error adding book to reading list:', error);
      alert('Failed to add book to reading list. Please try again.');
    } finally {
      setBorrowing(false);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.Author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.Genre.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || book.Type === filterType;
    
    const matchesAvailability = filterAvailability === 'all' ||
                               (filterAvailability === 'available' && book.Available) ||
                               (filterAvailability === 'borrowed' && !book.Available);
    
    return matchesSearch && matchesType && matchesAvailability;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view books</h1>
          <p>You need to be logged in to access the books library.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Books Library</h1>
          <p className="text-blue-200">Discover and borrow books from our collection</p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors, genres..."
              className="p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="p-3 bg-white/20 text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all" className="text-black">All Types</option>
              <option value="hardcopy" className="text-black">Hardcopy</option>
              <option value="softcopy" className="text-black">Softcopy</option>
            </select>
            
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value as any)}
              className="p-3 bg-white/20 text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all" className="text-black">All Books</option>
              <option value="available" className="text-black">Available</option>
              <option value="borrowed" className="text-black">Borrowed</option>
            </select>
            
            <div className="text-white text-center flex items-center justify-center">
              <span className="text-sm">{filteredBooks.length} books found</span>
            </div>
          </div>
        </motion.div>

        {/* Borrowed Books Section */}
        {borrowHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Your Borrowed Books</h2>
            <div className="space-y-3">
              {borrowHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-4">
                  <div>
                    <h3 className="text-white font-semibold">{entry.book_title}</h3>
                    <p className="text-blue-200 text-sm">
                      Borrowed: {formatDate(entry.borrow_date)}
                      {entry.returned && ` • Returned: ${formatDate(entry.return_date)}`}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    entry.returned 
                      ? 'bg-green-600 text-white' 
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {entry.returned ? 'Returned' : 'Active'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading books...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="col-span-full text-center text-white">
              <p className="text-xl">No books found</p>
              <p className="text-blue-200 mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredBooks.map((book, index) => (
              <motion.div
                key={book.ID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => handleBookClick(book)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{book.Title}</h3>
                    <p className="text-blue-200 mb-2">by {book.Author}</p>
                    <p className="text-blue-300 text-sm">{book.Genre}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      book.Type === 'hardcopy' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-purple-600 text-white'
                    }`}>
                      {book.Type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      book.Available 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {book.Available ? 'Available' : 'Borrowed'}
                    </span>
                  </div>
                </div>
                
                <p className="text-white text-sm mb-4 line-clamp-3">{book.AboutTheBook}</p>
                
                <div className="flex justify-between items-center text-sm text-blue-200">
                  <span>{book.TotalPages} pages</span>
                  <span>Added {formatDate(book.CreatedAt)}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Book Detail Modal */}
        {selectedBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{selectedBook.Title}</h2>
                  <p className="text-gray-600 text-lg mb-2">by {selectedBook.Author}</p>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedBook.Type === 'hardcopy' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedBook.Type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedBook.Available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedBook.Available ? 'Available' : 'Borrowed'}
                    </span>
                    <span className="text-gray-500">{selectedBook.Genre}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedBook.AboutTheBook}</p>
                </div>

                {/* Book Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800">Pages</h4>
                    <p className="text-gray-600">{selectedBook.TotalPages}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">ISBN</h4>
                    <p className="text-gray-600">{selectedBook.ISBN}</p>
                  </div>
                </div>

                {/* Type-specific Information */}
                {selectedBook.Type === 'hardcopy' ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Hardcopy Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">Location</h4>
                        <p className="text-gray-600">{selectedBook.PhysicalLocation}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Handler Contact</h4>
                        <p className="text-gray-600">{selectedBook.PhoneNumberOfTheHandler}</p>
                      </div>
                    </div>

                    {/* Current Readers */}
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Who's Reading This Book</h4>
                      {loadingReaders ? (
                        <p className="text-gray-500">Loading readers...</p>
                      ) : bookReaders.length > 0 ? (
                        <div className="space-y-2">
                          {bookReaders.map((reader, index) => (
                            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {reader.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{reader.name}</p>
                                <p className="text-sm text-gray-500">{reader.reader_id}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No one is currently reading this book</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Softcopy Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div>
                        <h4 className="font-semibold text-gray-800">Access URL</h4>
                        <a 
                          href={selectedBook.SoftcopyURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {selectedBook.SoftcopyURL}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4 border-t">
                  {selectedBook.Type === 'hardcopy' && selectedBook.Available ? (
                    <motion.button
                      onClick={() => handleBorrowBook(selectedBook)}
                      disabled={borrowing}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                      whileHover={!borrowing ? { scale: 1.05 } : {}}
                      whileTap={!borrowing ? { scale: 0.95 } : {}}
                    >
                      {borrowing ? 'Borrowing...' : 'Borrow Book'}
                    </motion.button>
                  ) : selectedBook.Type === 'softcopy' ? (
                    <motion.button
                      onClick={() => handleAddToReading(selectedBook)}
                      disabled={borrowing}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                      whileHover={!borrowing ? { scale: 1.05 } : {}}
                      whileTap={!borrowing ? { scale: 0.95 } : {}}
                    >
                      {borrowing ? 'Adding...' : 'Add to Reading List'}
                    </motion.button>
                  ) : (
                    <div className="flex-1 bg-gray-300 text-gray-600 py-3 rounded-lg font-semibold text-center">
                      Currently Unavailable
                    </div>
                  )}
                  
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BooksPage;

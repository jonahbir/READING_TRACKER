import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { submitBookToCommunity } from '../api/api';

const SubmitBookPage: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    type: 'hardcopy' as 'hardcopy' | 'softcopy',
    physical_location: '',
    phone_number_of_the_handler: '',
    softcopy_url: '',
    about_the_book: '',
    total_pages: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validate required fields
    if (!formData.title.trim() || !formData.author.trim()) {
      setMessage({ type: 'error', text: 'Title and author are required.' });
      return;
    }

    if (formData.type === 'hardcopy') {
      if (!formData.physical_location.trim() || !formData.phone_number_of_the_handler.trim()) {
        setMessage({ type: 'error', text: 'Physical location and phone number are required for hardcopy books.' });
        return;
      }
    } else if (formData.type === 'softcopy') {
      if (!formData.softcopy_url.trim()) {
        setMessage({ type: 'error', text: 'Download URL is required for softcopy books.' });
        return;
      }
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const submissionData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || undefined,
        genre: formData.genre.trim() || undefined,
        type: formData.type,
        physical_location: formData.physical_location.trim() || undefined,
        phone_number_of_the_handler: formData.phone_number_of_the_handler.trim() || undefined,
        softcopy_url: formData.softcopy_url.trim() || undefined,
        about_the_book: formData.about_the_book.trim() || undefined,
        total_pages: formData.total_pages ? parseInt(formData.total_pages) : undefined,
      };

      await submitBookToCommunity(submissionData);
      
      setMessage({ 
        type: 'success', 
        text: 'Book submitted successfully! It will be reviewed by an admin before being added to the library.' 
      });
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        isbn: '',
        genre: '',
        type: 'hardcopy',
        physical_location: '',
        phone_number_of_the_handler: '',
        softcopy_url: '',
        about_the_book: '',
        total_pages: '',
      });
    } catch (error: any) {
      console.error('Error submitting book:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to submit book. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to submit books</h1>
          <p>You need to be logged in to submit books to the community library.</p>
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
          <h1 className="text-4xl font-bold text-white mb-2">
            Submit Book to Community
          </h1>
          <p className="text-blue-200">Help grow our library by sharing books with fellow readers</p>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-4 mb-6 ${
              message.type === 'success' 
                ? 'bg-green-500/20 border border-green-500/50 text-green-200' 
                : 'bg-red-500/20 border border-red-500/50 text-red-200'
            }`}
          >
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 002.828 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 002.828 0l2-2a1 1 0 00-1.414-1.414L11 7.586 8.707 5.293z" clipRule="evenodd" />
                </svg>
              )}
              <p>{message.text}</p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Basic Information</h3>
              
              <div>
                <label className="block text-white font-medium mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter book title"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Author <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter author name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="ISBN (optional)"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Genre</label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Genre (optional)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Total Pages</label>
                <input
                  type="number"
                  name="total_pages"
                  value={formData.total_pages}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Number of pages (optional)"
                />
              </div>
            </div>

            {/* Book Type */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Book Type</h3>
              
              <div>
                <label className="block text-white font-medium mb-2">
                  Type <span className="text-red-400">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 bg-white/20 text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="hardcopy" className="bg-gray-800">Hardcopy Book</option>
                  <option value="softcopy" className="bg-gray-800">Digital Book (Softcopy)</option>
                </select>
              </div>

              {/* Conditional fields based on book type */}
              {formData.type === 'hardcopy' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Physical Location <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="physical_location"
                      value={formData.physical_location}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="e.g., Room 205, Dormitory A"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Contact Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone_number_of_the_handler"
                      value={formData.phone_number_of_the_handler}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Phone number for contact"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Download URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    name="softcopy_url"
                    value={formData.softcopy_url}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="https://example.com/book-download"
                  />
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Additional Information</h3>
              
              <div>
                <label className="block text-white font-medium mb-2">About the Book</label>
                <textarea
                  name="about_the_book"
                  value={formData.about_the_book}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  placeholder="Brief description of the book, its content, and why others might enjoy it..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <motion.button
                type="submit"
                disabled={submitting}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  submitting
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
                whileHover={!submitting ? { scale: 1.05 } : {}}
                whileTap={!submitting ? { scale: 0.95 } : {}}
              >
                {submitting ? 'Submitting...' : 'Submit Book'}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Information Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mt-8 bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-500/50"
        >
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-300 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-blue-200 font-semibold mb-2">Submission Process</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Your book submission will be reviewed by an administrator</li>
                <li>• Once approved, the book will be added to our community library</li>
                <li>• You'll be notified about the approval status</li>
                <li>• For hardcopy books, make sure the location and contact info are accurate</li>
                <li>• For digital books, ensure the download link is accessible and legal</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubmitBookPage;

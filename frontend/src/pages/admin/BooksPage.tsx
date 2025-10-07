import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addBook, getBooks, updateBook, returnBook, getPendingBooks, approvePendingBook, rejectPendingBook } from '../../api/api';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <motion.div 
    className="rounded-xl p-6 bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h2 className="text-white font-semibold text-xl mb-4 flex items-center">
      <span className="mr-2">📚</span>{title}
    </h2>
    {children}
  </motion.div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    {...props} 
    className={`w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all border border-white/10 ${props.className || ''}`} 
  />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea 
    {...props} 
    className={`w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all border border-white/10 ${props.className || ''}`} 
    rows={3}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select 
    {...props}
    className="w-full px-4 py-3 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all border border-white/10"
  />
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}> = ({ children, onClick, type = 'button', variant = 'primary', className = '' }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center space-x-2";
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white"
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const BookCard: React.FC<{
  book: any;
  onViewDetails: (book: any) => void;
  onUpdate: (book: any) => void;
  onViewReaders: (isbn: string) => void;
  onMarkReturned: (book: any) => void;
}> = ({ book, onViewDetails, onUpdate, onViewReaders, onMarkReturned }) => (
  <motion.div
    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl cursor-pointer relative overflow-hidden group"
    whileHover={{ scale: 1.02, y: -5 }}
    onClick={() => onViewDetails(book)}
  >
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="secondary" className="text-sm px-2 py-1" onClick={(e) => { e.stopPropagation(); onUpdate(book); }}>
        Update
      </Button>
    </div>
    <h3 className="text-white font-bold text-lg mb-2 truncate">{book.Title}</h3>
    <p className="text-cyan-300 mb-1">By {book.Author}</p>
    <p className="text-gray-300 text-sm mb-2">ISBN: {book.ISBN}</p>
    <div className="flex justify-between items-center mb-3">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${book.Available ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
        {book.Type} - {book.Available ? 'Available' : 'Borrowed'}
      </span>
      <span className="text-gray-400 text-sm">{book.Genre}</span>
    </div>
    <div className="flex gap-2 mb-3 flex-wrap">
      <Button variant="secondary" className="text-sm px-2 py-1" onClick={(e) => { e.stopPropagation(); onViewReaders(book.ISBN); }}>
        View Readers
      </Button>
      {!book.Available && (
        <Button variant="danger" className="text-sm px-2 py-1" onClick={(e) => { e.stopPropagation(); onMarkReturned(book); }}>
          Mark Returned
        </Button>
      )}
    </div>
    {book.AboutTheBook && (
      <p className="text-gray-300 text-sm italic opacity-0 group-hover:opacity-100 transition-opacity">
        "{book.AboutTheBook.substring(0, 100)}..."
      </p>
    )}
  </motion.div>
);

const BookModal: React.FC<{
  book: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ book, isOpen, onClose }) => {
  if (!isOpen || !book) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl text-white border border-white/20 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-2">📖</span>{book.Title}
          </h3>
          <div className="space-y-3 text-sm">
            <p><span className="font-semibold text-cyan-300">Author:</span> {book.Author}</p>
            <p><span className="font-semibold text-cyan-300">ISBN:</span> {book.ISBN}</p>
            <p><span className="font-semibold text-cyan-300">Genre:</span> {book.Genre}</p>
            <p><span className="font-semibold text-cyan-300">Type:</span> {book.Type}</p>
            <p><span className="font-semibold text-cyan-300">Available:</span> {book.Available ? 'Yes' : 'No'}</p>
            {book.PhysicalLocation && <p><span className="font-semibold text-cyan-300">Location:</span> {book.PhysicalLocation}</p>}
            {book.PhoneNumberOfTheHandler && <p><span className="font-semibold text-cyan-300">Handler Phone:</span> {book.PhoneNumberOfTheHandler}</p>}
            {book.SoftcopyURL && <p><span className="font-semibold text-cyan-300">Softcopy:</span> <a href={book.SoftcopyURL} className="underline text-blue-400">Link</a></p>}
            {book.TotalPages && <p><span className="font-semibold text-cyan-300">Pages:</span> {book.TotalPages}</p>}
            {book.AboutTheBook && (
              <div>
                <span className="font-semibold text-cyan-300">About:</span>
                <p className="mt-1 italic text-gray-300">{book.AboutTheBook}</p>
              </div>
            )}
            <p><span className="font-semibold text-cyan-300">Created:</span> {new Date(book.CreatedAt).toLocaleDateString()}</p>
          </div>
          <Button onClick={onClose} className="mt-6 w-full" variant="secondary">
            Close
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const FormModal: React.FC<{
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (updater: (prev: any) => any) => void;
  isUpdate?: boolean;
  mode?: 'add' | 'update' | 'return';
  type?: 'hardcopy' | 'softcopy';
  children?: React.ReactNode;
}> = ({ title, isOpen, onClose, onSubmit, formData, setFormData, isUpdate = false, mode = 'add', type = 'hardcopy', children }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 max-w-md w-full shadow-2xl text-white border border-white/20 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h3 className="text-xl font-bold mb-4">{title}</h3>
          <form onSubmit={onSubmit} className="space-y-3">
            {mode === 'return' ? (
              <>
                <div className="p-3 bg-white/10 rounded-lg">
                  <label className="block text-sm font-semibold text-cyan-300 mb-1">ISBN:</label>
                  <p className="text-white">{formData.isbn}</p>
                </div>
                {children}
              </>
            ) : (
              <>
                {!isUpdate && (
                  <>
                    <Input placeholder="Title *" required value={formData.title || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))} />
                    <Input placeholder="Author *" required value={formData.author || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, author: e.target.value }))} />
                    <Input placeholder="ISBN *" required value={formData.isbn || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, isbn: e.target.value }))} />
                  </>
                )}
                <Input placeholder="Genre" value={formData.genre || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, genre: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  {!isUpdate && (
                    <Select value={formData.type || type} onChange={(e) => setFormData((prev: any) => ({ ...prev, type: e.target.value }))}>
                      <option value="hardcopy">Hardcopy</option>
                      <option value="softcopy">Softcopy</option>
                    </Select>
                  )}
                  <Input placeholder="Total Pages" type="number" value={formData.total_pages || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, total_pages: Number(e.target.value) }))} />
                </div>
                {formData.type === 'hardcopy' ? (
                  <>
                    <Input placeholder="Physical Location" value={formData.physical_location || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, physical_location: e.target.value }))} />
                    <Input placeholder="Phone Number of Handler" value={formData.phone_number_of_the_handler || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, phone_number_of_the_handler: e.target.value }))} />
                  </>
                ) : (
                  <Input placeholder="Softcopy URL" value={formData.softcopy_url || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, softcopy_url: e.target.value }))} />
                )}
                <TextArea placeholder="About the Book" value={formData.about_the_book || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, about_the_book: e.target.value }))} />
                {isUpdate && (
                  <Input placeholder="ISBN (required for update)" required value={formData.isbn || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, isbn: e.target.value }))} />
                )}
                {children}
              </>
            )}
            <Button type="submit" variant="primary" className="w-full">
              {title.includes('Add') ? 'Add Book' : title.includes('Update') ? 'Update Book' : 'Mark Returned'}
            </Button>
          </form>
          <Button onClick={onClose} variant="secondary" className="mt-3 w-full">
            Cancel
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ReadersModal: React.FC<{
  isbn: string;
  readers: any[];
  isOpen: boolean;
  onClose: () => void;
}> = ({ isbn, readers, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 max-w-md w-full shadow-2xl text-white border border-white/20 max-h-[60vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h3 className="text-xl font-bold mb-4">Active Readers for {isbn}</h3>
          <ul className="space-y-2">
            {readers.length > 0 ? (
              readers.map((r, i) => (
                <li key={i} className="bg-white/5 p-3 rounded-lg">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-cyan-300">{r.reader_id}</p>
                  <p className="text-gray-300">{r.email}</p>
                </li>
              ))
            ) : (
              <p className="text-gray-400">No active readers.</p>
            )}
          </ul>
          <Button onClick={onClose} className="mt-4 w-full" variant="secondary">
            Close
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const PendingBookModal: React.FC<{
  book: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ book, isOpen, onClose }) => {
  if (!isOpen || !book) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl text-white border border-white/20 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-2">📖</span>{book.title}
          </h3>
          <div className="space-y-3 text-sm">
            <p><span className="font-semibold text-cyan-300">Author:</span> {book.author}</p>
            <p><span className="font-semibold text-cyan-300">ISBN:</span> {book.isbn}</p>
            <p><span className="font-semibold text-cyan-300">Genre:</span> {book.genre}</p>
            <p><span className="font-semibold text-cyan-300">Type:</span> {book.type}</p>
            {book.physical_location && <p><span className="font-semibold text-cyan-300">Location:</span> {book.physical_location}</p>}
            {book.phone_number_of_the_handler && <p><span className="font-semibold text-cyan-300">Handler Phone:</span> {book.phone_number_of_the_handler}</p>}
            {book.softcopy_url && <p><span className="font-semibold text-cyan-300">Softcopy:</span> <a href={book.softcopy_url} className="underline text-blue-400">Link</a></p>}
            {book.total_pages && <p><span className="font-semibold text-cyan-300">Pages:</span> {book.total_pages}</p>}
            {book.about_the_book && (
              <div>
                <span className="font-semibold text-cyan-300">About:</span>
                <p className="mt-1 italic text-gray-300">{book.about_the_book}</p>
              </div>
            )}
            <p><span className="font-semibold text-cyan-300">Submitted By:</span> {book.submitted_by_name} ({book.submitted_by_reader_id})</p>
            <p><span className="font-semibold text-cyan-300">Submitted:</span> {new Date(book.submitted_at).toLocaleDateString()}</p>
            <p><span className="font-semibold text-yellow-300">Status:</span> {book.status}</p>
            {book.rejection_reason && <p><span className="font-semibold text-red-300">Rejection Reason:</span> {book.rejection_reason}</p>}
          </div>
          <Button onClick={onClose} className="mt-6 w-full" variant="secondary">
            Close
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const PendingBookCard: React.FC<{
  pendingBook: any;
  onViewDetails: (book: any) => void;
  onApprove: (id: string) => void;
}> = ({ pendingBook, onViewDetails, onApprove }) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    if (!window.confirm('Are you sure you want to reject this book?')) return;
    try {
      await rejectPendingBook(pendingBook.id, rejectReason);
      setRejectReason('');
      setShowRejectModal(false);
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Failed to reject');
    }
  };

  return (
    <motion.div
      className="bg-yellow/10 backdrop-blur-sm rounded-xl p-6 border border-yellow/20 shadow-xl cursor-pointer relative overflow-hidden group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      onClick={() => onViewDetails(pendingBook)}
    >
      <div className="pb-20">
        <h4 className="text-white font-bold text-lg mb-2">{pendingBook.title} by {pendingBook.author}</h4>
        <p className="text-gray-300 mb-2">ISBN: {pendingBook.isbn} | Genre: {pendingBook.genre} | Type: {pendingBook.type}</p>
        <p className="text-sm text-yellow-300 mb-4">Submitted by: {pendingBook.submitted_by_name} ({pendingBook.submitted_by_reader_id}) on {new Date(pendingBook.submitted_at).toLocaleDateString()}</p>
        {pendingBook.rejection_reason && (
          <p className="text-red-300 text-sm mb-4 italic">Rejected: {pendingBook.rejection_reason}</p>
        )}
      </div>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <Button variant="primary" className="text-sm px-2 py-1" onClick={(e) => { e.stopPropagation(); onApprove(pendingBook.id); }}>
          Approve
        </Button>
        <Button variant="danger" className="text-sm px-2 py-1" onClick={(e) => { e.stopPropagation(); setShowRejectModal(true); }}>
          Reject
        </Button>
      </div>

      {/* Simple Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 max-w-md w-full shadow-2xl text-white border border-white/20"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3 className="text-xl font-bold mb-4">Reject Pending Book</h3>
              <form onSubmit={handleReject} className="space-y-3">
                <TextArea
                  placeholder="Rejection reason *"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="danger" className="flex-1">
                    Reject
                  </Button>
                  <Button type="button" onClick={() => setShowRejectModal(false)} variant="secondary" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [pendingBooks, setPendingBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedPendingBook, setSelectedPendingBook] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReadersModal, setShowReadersModal] = useState(false);
  const [currentReaders, setCurrentReaders] = useState<any[]>([]);
  const [currentIsbn, setCurrentIsbn] = useState('');

  const [newBook, setNewBook] = useState<any>({ type: 'hardcopy' });
  const [updateData, setUpdateData] = useState<any>({});
  const [returnData, setReturnData] = useState<{ isbn?: string; reader_id?: string }>({});

  const booksMemo = useMemo(() => books, [books]);
  const pendingBooksMemo = useMemo(() => pendingBooks, [pendingBooks]);

  const loadBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (e: any) {
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingBooks = async () => {
    try {
      const response = await getPendingBooks('pending');
      setPendingBooks(response.pending_books || []);
    } catch (e: any) {
      console.error('Failed to load pending books');
    }
  };

  useEffect(() => {
    loadBooks();
    loadPendingBooks();
  }, []);

  const onAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBook(newBook);
      setNewBook({ type: 'hardcopy' });
      setShowAddModal(false);
      loadBooks();
    } catch (e: any) {
      alert(e.message || 'Failed to add book');
    }
  };

  const onUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBook(updateData);
      setUpdateData({});
      setShowUpdateModal(false);
      loadBooks();
    } catch (e: any) {
      alert(e.message || 'Failed to update book');
    }
  };

  const onReturnBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnData.isbn || !returnData.reader_id) return;
    if (!window.confirm('Are you sure you want to mark this book as returned?')) return;
    try {
      await returnBook(returnData.isbn, returnData.reader_id);
      setReturnData({});
      setShowReturnModal(false);
      loadBooks();
    } catch (e: any) {
      alert(e.message || 'Failed to return book');
    }
  };

  const onCheckReaders = async (isbn: string) => {
    try {
      const token = localStorage.getItem('jwtToken') || '';
      const response = await fetch('http://localhost:8080/check-book-readers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isbn }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCurrentReaders(data.active_readers || []);
      setCurrentIsbn(isbn);
      setShowReadersModal(true);
    } catch (e: any) {
      console.error('Error fetching readers:', e);
      alert(e.message || 'Failed to get readers');
    }
  };

  const handleApprovePending = async (id: string) => {
    if (!window.confirm('Approve this book? It will be added to the library.')) return;
    try {
      await approvePendingBook(id);
      loadPendingBooks();
      loadBooks();
    } catch (e: any) {
      alert(e.message || 'Failed to approve');
    }
  };

  const handleUpdateOpen = (book: any) => {
    setUpdateData({
      isbn: book.ISBN,
      title: book.Title,
      author: book.Author,
      type: book.Type,
      genre: book.Genre,
      physical_location: book.PhysicalLocation,
      phone_number_of_the_handler: book.PhoneNumberOfTheHandler,
      softcopy_url: book.SoftcopyURL,
      about_the_book: book.AboutTheBook,
      total_pages: book.TotalPages,
    });
    setShowUpdateModal(true);
  };

  const handleReturnOpen = (book: any) => {
    setReturnData({ isbn: book.ISBN, reader_id: '' });
    setShowReturnModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-650 via-blue-900 to-black p-4 sm:p-6 pt-10 relative overflow-hidden space-y-6 sm:space-y-8">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative z-10">
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="mb-4 sm:mb-6 w-full sm:w-auto">
          + Add New Book
        </Button>

        <Section title="Library Books">
          {loading ? (
            <div className="text-white text-center py-6">Loading...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-6">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {booksMemo.map((book) => (
                <BookCard
                  key={book.ID}
                  book={book}
                  onViewDetails={setSelectedBook}
                  onUpdate={handleUpdateOpen}
                  onViewReaders={onCheckReaders}
                  onMarkReturned={handleReturnOpen}
                />
              ))}
            </div>
          )}
        </Section>

        <Section title="Pending Book Approvals">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pendingBooksMemo.map((pb) => (
              <PendingBookCard
                key={pb.id}
                pendingBook={pb}
                onViewDetails={setSelectedPendingBook}
                onApprove={handleApprovePending}
              />
            ))}
          </div>
          {pendingBooksMemo.length === 0 && <p className="text-gray-400 text-center py-4">No pending books.</p>}
        </Section>
      </div>

      <BookModal book={selectedBook} isOpen={!!selectedBook} onClose={() => setSelectedBook(null)} />
      <PendingBookModal book={selectedPendingBook} isOpen={!!selectedPendingBook} onClose={() => setSelectedPendingBook(null)} />
      <FormModal
        title="Add New Book"
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={onAddBook}
        formData={newBook}
        setFormData={setNewBook}
        mode="add"
      />
      <FormModal
        title="Update Book"
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSubmit={onUpdateBook}
        formData={updateData}
        setFormData={setUpdateData}
        isUpdate={true}
        mode="update"
      />
      <FormModal
        title="Mark Book as Returned"
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSubmit={onReturnBook}
        formData={returnData}
        setFormData={setReturnData}
        mode="return"
      >
        <Input
          placeholder="Reader ID *"
          value={returnData.reader_id || ''}
          onChange={(e) => setReturnData((prev) => ({ ...prev, reader_id: e.target.value }))}
          required
        />
      </FormModal>
      <ReadersModal
        isbn={currentIsbn}
        readers={currentReaders}
        isOpen={showReadersModal}
        onClose={() => setShowReadersModal(false)}
      />
    </div>
  );
};

export default BooksPage;
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchReviews, searchQuotes, approveReview } from '../../api/api';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <motion.div 
    className="rounded-xl p-6 bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h2 className="text-white font-semibold text-xl mb-4 flex items-center">
      <span className="mr-2">⭐</span>{title}
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

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'emerald';
  className?: string;
}> = ({ children, onClick, type = 'button', variant = 'primary', className = '' }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center space-x-2";
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white"
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

const ReviewCard: React.FC<{
  review: any;
  isPending: boolean;
  onViewDetails: (review: any) => void;
  onApprove?: (review: any) => void;
  onReject?: (review: any) => void;
}> = ({ review, isPending, onViewDetails, onApprove, onReject }) => (
  <motion.div
    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl cursor-pointer relative overflow-hidden group"
    whileHover={{ scale: 1.02, y: -5 }}
    onClick={() => onViewDetails(review)}
  >
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
      {isPending && onApprove && (
        <Button variant="emerald" className="text-sm px-2 py-1" onClick={(e) => { e.stopPropagation(); onApprove(review); }}>
          Approve
        </Button>
      )}
      {isPending && onReject && (
        <Button variant="danger" className="text-sm px-2 py-1" onClick={(e) => { e.stopPropagation(); onReject(review); }}>
          Reject
        </Button>
      )}
    </div>
    <p className="text-cyan-300 mb-1">By {review.user_name || review.reader_id}</p>
    <div className="flex justify-between items-center mb-3">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPending ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
        {isPending ? 'Pending' : 'Approved'}
      </span>
      <span className="text-gray-400 text-sm">{review.upvotes || 0} Upvotes</span>
    </div>
    <p className="text-gray-300 text-sm italic opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
      "{review.review_text.substring(0, 100)}..."
    </p>
  </motion.div>
);

const ReviewModal: React.FC<{
  review: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (review: any) => void;
  onReject?: (review: any) => void;
}> = ({ review, isOpen, onClose, onApprove, onReject }) => {
  if (!isOpen || !review) return null;

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
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-2xl w-full shadow-2xl text-white border border-white/20 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-2">📝</span>Review Details
          </h3>
          <div className="space-y-3 text-sm mb-6">
            <p><span className="font-semibold text-cyan-300">Reviewer:</span> {review.user_name || review.reader_id}</p>
            <p><span className="font-semibold text-cyan-300">Upvotes:</span> {review.upvotes || 0}</p>
            <p><span className="font-semibold text-cyan-300">Created:</span> {new Date(review.created_at).toLocaleDateString()}</p>
            <div>
              <span className="font-semibold text-cyan-300">Review:</span>
              <p className="mt-1 text-gray-300">{review.review_text}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            {onApprove && (
              <Button onClick={() => onApprove(review)} variant="emerald" className="px-6">
                Approve
              </Button>
            )}
            {onReject && (
              <Button onClick={() => onReject(review)} variant="danger" className="px-6">
                Reject
              </Button>
            )}
            <Button onClick={onClose} variant="secondary" className="px-6">
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ConfirmModal: React.FC<{
  action: 'approve' | 'reject';
  review: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ action, review, isOpen, onClose, onConfirm }) => {
  if (!isOpen || !review) return null;

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
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 max-w-md w-full shadow-2xl text-white border border-white/20"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h3 className="text-xl font-bold mb-4 text-center">
            {action === 'approve' ? 'Approve Review?' : 'Reject Review?'}
          </h3>
          <p className="text-gray-300 mb-6 text-center">
            Are you sure you want to {action} the review by {review.user_name || review.reader_id}?
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onConfirm} variant={action === 'approve' ? 'emerald' : 'danger'} className="px-6">
              Yes, {action.charAt(0).toUpperCase() + action.slice(1)}
            </Button>
            <Button onClick={onClose} variant="secondary" className="px-6">
              Cancel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const QuoteCard: React.FC<{ quote: any }> = ({ quote }) => (
  <motion.div
    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl cursor-pointer relative overflow-hidden group"
    whileHover={{ scale: 1.02, y: -5 }}
  >
    <p className="text-white font-semibold text-lg italic mb-2">"{quote.text}"</p>
    <p className="text-cyan-300 text-sm">— {quote.user_name || quote.reader_id}</p>
    <p className="text-gray-400 text-xs mt-2">{new Date(quote.created_at).toLocaleDateString()}</p>
  </motion.div>
);

const ModerationPage: React.FC = () => {
  const [reviewQuery, setReviewQuery] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [quotesQuery, setQuotesQuery] = useState('');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject'>('approve');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchReviews = async (query = '') => {
    setReviewLoading(true);
    try {
      const res = await searchReviews(query);
      setReviews(res.reviews || []);
    } catch (e: any) {
      console.error('Failed to fetch reviews:', e);
      showToast('Failed to fetch reviews. Please try again.', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  const fetchQuotes = async (query = '') => {
    try {
      const res = await searchQuotes(query);
      setQuotes(res.quotes || []);
    } catch (e: any) {
      console.error('Failed to fetch quotes:', e);
      showToast('Failed to fetch quotes. Please try again.', 'error');
    }
  };

  const handleApprove = (review: any) => {
    setSelectedReview(review);
    setConfirmAction('approve');
    setShowConfirmModal(true);
  };

  const handleReject = (review: any) => {
    setSelectedReview(review);
    setConfirmAction('reject');
    setShowConfirmModal(true);
  };

  const confirmActionHandler = async () => {
    if (!selectedReview) return;
    try {
      await approveReview({ review_id: selectedReview.id, status: confirmAction === 'approve' ? 'approved' : 'rejected' });
      fetchReviews(reviewQuery);
      setShowConfirmModal(false);
      showToast(`Review ${confirmAction}d successfully!`, 'success');
    } catch (e: any) {
      showToast(`Failed to ${confirmAction} review. Please try again.`, 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toastDiv = document.createElement('div');
    toastDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white`;
    toastDiv.textContent = message;
    document.body.appendChild(toastDiv);
    setTimeout(() => {
      document.body.removeChild(toastDiv);
    }, 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchReviews(reviewQuery);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchQuotes();
  }, []);

  const pendingReviews = reviews.filter((r: any) => r.posted !== true);
  const approvedReviews = reviews.filter((r: any) => r.posted === true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-650 via-blue-900 to-black p-4 sm:p-6 pt-10 relative overflow-hidden space-y-6 sm:space-y-8">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative z-10">
        {/* Reviews Section */}
        <Section title="Review Moderation">
          <form onSubmit={(e) => { e.preventDefault(); fetchReviews(reviewQuery); }} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <Input 
              placeholder="Search reviews..." 
              value={reviewQuery} 
              onChange={(e) => setReviewQuery(e.target.value)} 
              onKeyDown={handleKeyDown}
            />
            <Button type="submit" variant="primary" className="w-full md:w-auto">
              Search Reviews
            </Button>
          </form>
          {reviewLoading ? (
            <div className="text-white text-center py-6">Loading reviews...</div>
          ) : (
            <>
              <div className="mb-8">
                <h3 className="text-white font-semibold mb-4">Pending Reviews ({pendingReviews.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {pendingReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isPending={true}
                      onViewDetails={setSelectedReview}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Approved Reviews ({approvedReviews.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {approvedReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isPending={false}
                      onViewDetails={setSelectedReview}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </Section>

        {/* Quotes Section */}
        <Section title="Quotes Moderation">
          <form onSubmit={(e) => { e.preventDefault(); fetchQuotes(quotesQuery); }} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <Input 
              placeholder="Search quotes..." 
              value={quotesQuery} 
              onChange={(e) => setQuotesQuery(e.target.value)} 
              onKeyDown={handleKeyDown}
            />
            <Button type="submit" variant="primary" className="w-full md:w-auto">
              Search Quotes
            </Button>
          </form>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {quotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
          {quotes.length === 0 && <p className="text-gray-400 text-center py-4">No quotes found.</p>}
        </Section>
      </div>

      <ReviewModal 
        review={selectedReview} 
        isOpen={!!selectedReview} 
        onClose={() => setSelectedReview(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <ConfirmModal
        action={confirmAction}
        review={selectedReview}
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmActionHandler}
      />
    </div>
  );
};

export default ModerationPage;
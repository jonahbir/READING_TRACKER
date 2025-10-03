import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  getPublicReviews, 
  searchQuotes, 
  addQuote, 
  toggleUpvoteReview, 
  toggleUpvoteQuote,
  postCommentOnReview,
  addCommentOnQuote,
  searchReviews,
  toggleUpvoteComment,
  toggleUpvoteQuoteComment,
  getReviewComments,
  getQuoteComments
} from '../api/api';

interface Post {
  id: string;
  type: 'quote' | 'review';
  content: string;
  user_name: string;
  reader_id: string;
  upvotes: number;
  created_at: string;
  book_title?: string;
  isbn?: string;
  comments?: PostComment[];
}

interface PostComment {
  id: string;
  text: string;
  user_name: string;
  reader_id: string;
  upvotes: number;
  created_at: string;
}

// Extended Review interface to include _id
interface ReviewWithId {
  id?: string;
  _id?: string;
  reader_id: string;
  review_text: string;
  upvotes: number;
  created_at: string;
  user_name?: string;
}

const PostsPage: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuote, setNewQuote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [commentsByPostId, setCommentsByPostId] = useState<{ [key: string]: PostComment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isLoggedIn) {
      loadPosts();
    }
  }, [isLoggedIn]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const [reviewsResponse, quotesResponse] = await Promise.all([
        getPublicReviews(),
        searchQuotes()
      ]);

      const reviews = reviewsResponse.reviews ?? [];
      const quotes = quotesResponse.quotes ?? [];
      // Merge and sort posts by creation time
      const allPosts: Post[] = [
        ...reviews
          .filter((review: ReviewWithId) => !!review.id || !!review._id)
          .map((review: ReviewWithId) => ({
            id: review.id || review._id || '',
            type: 'review' as const,
            content: review.review_text,
            user_name: review.user_name || review.reader_id,
            reader_id: review.reader_id,
            upvotes: review.upvotes,
            created_at: review.created_at,
            comments: []
          })),
        ...quotes.map(quote => ({
          id: quote.id,
          type: 'quote' as const,
          content: quote.text,
          user_name: quote.user_name,
          reader_id: quote.reader_id,
          upvotes: quote.upvotes,
          created_at: quote.created_at,
          comments: []
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.trim() || submittingQuote) return;

    try {
      setSubmittingQuote(true);
      await addQuote({ text: newQuote });
      setNewQuote('');
      loadPosts(); // Reload posts to show the new quote
    } catch (error) {
      console.error('Error submitting quote:', error);
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleLike = async (post: Post) => {
    try {
      if (post.type === 'review') {
        await toggleUpvoteReview(post.id);
      } else {
        await toggleUpvoteQuote(post.id);
      }
      loadPosts(); // Reload to get updated like counts
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Failed to like post. Please try again.');
    }
  };

  const handleComment = async (post: Post) => {
    const commentText = commentTexts[post.id];
    if (!commentText?.trim()) return;

    try {
      if (post.type === 'review') {
        await postCommentOnReview({
          review_id: post.id,
          text: commentText
        });
      } else {
        await addCommentOnQuote({
          quote_id: post.id,
          text: commentText
        });
      }
      setCommentTexts({ ...commentTexts, [post.id]: '' });
      loadPosts(); // Reload to show new comment
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPosts();
      return;
    }

    try {
      setLoading(true);
      const [reviewsResponse, quotesResponse] = await Promise.all([
        searchReviews(searchQuery),
        searchQuotes(searchQuery)
      ]);

      const searchResults: Post[] = [
        ...(reviewsResponse.reviews ?? []).filter((review: ReviewWithId) => !!review.id || !!review._id)
          .map((review: ReviewWithId) => ({
            id: review.id || review._id || '',
            type: 'review' as const,
            content: review.review_text,
            user_name: review.user_name || review.reader_id,
            reader_id: review.reader_id,
            upvotes: review.upvotes,
            created_at: review.created_at,
            comments: []
          })),
        ...(quotesResponse.quotes ?? []).map(quote => ({
          id: quote.id,
          type: 'quote' as const,
          content: quote.text,
          user_name: quote.user_name,
          reader_id: quote.reader_id,
          upvotes: quote.upvotes,
          created_at: quote.created_at,
          comments: []
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(searchResults);
    } catch (error) {
      console.error('Error searching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComments = async (post: Post) => {
    setShowComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
    if (!showComments[post.id]) {
      // Only fetch if not already loaded
      setLoadingComments((prev) => ({ ...prev, [post.id]: true }));
      try {
        let comments: PostComment[] = [];
        if (post.type === 'review') {
          comments = await getReviewComments(post.id);
        } else {
          comments = await getQuoteComments(post.id);
        }
        setCommentsByPostId((prev) => ({ ...prev, [post.id]: comments }));
      } catch (error) {
        setCommentsByPostId((prev) => ({ ...prev, [post.id]: [] }));
      } finally {
        setLoadingComments((prev) => ({ ...prev, [post.id]: false }));
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view posts</h1>
          <p>You need to be logged in to access the posts feed.</p>
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
            Welcome back, {user?.name}!
          </h1>
          <p className="text-blue-200">Share your thoughts and discover what others are reading</p>
        </motion.div>

        {/* Quote Composer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8"
        >
          <form onSubmit={handleSubmitQuote}>
            <textarea
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              placeholder="Share an inspiring quote from your reading journey..."
              className="w-full p-4 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={3}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-blue-200 text-sm">
                {newQuote.length}/500 characters
              </span>
              <motion.button
                type="submit"
                disabled={submittingQuote || !newQuote.trim()}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  submittingQuote || !newQuote.trim()
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
                whileHover={!submittingQuote && newQuote.trim() ? { scale: 1.05 } : {}}
                whileTap={!submittingQuote && newQuote.trim() ? { scale: 0.95 } : {}}
              >
                {submittingQuote ? 'Sharing...' : 'Share Quote'}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8"
        >
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quotes and reviews..."
              className="flex-1 p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <motion.button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Search
            </motion.button>
            {searchQuery && (
              <motion.button
                onClick={() => {
                  setSearchQuery('');
                  loadPosts();
                }}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-white">
              <p className="text-xl">No posts found</p>
              <p className="text-blue-200 mt-2">
                {searchQuery ? 'Try a different search term' : 'Be the first to share a quote!'}
              </p>
            </div>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6"
              >
                {/* Post Header */}
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {post.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-white font-semibold">{post.user_name}</h3>
                    <p className="text-blue-200 text-sm">{formatDate(post.created_at)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      post.type === 'quote' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-green-600 text-white'
                    }`}>
                      {post.type === 'quote' ? 'Quote' : 'Review'}
                    </span>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-white text-lg leading-relaxed">{post.content}</p>
                  {post.book_title && (
                    <p className="text-blue-200 text-sm mt-2">Book: {post.book_title}</p>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between border-t border-white/20 pt-4">
                  <div className="flex items-center space-x-4">
                    <motion.button
                      onClick={() => handleLike(post)}
                      className="flex items-center space-x-2 text-blue-200 hover:text-red-400 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span>{post.upvotes}</span>
                    </motion.button>

                    <motion.button
                      onClick={() => handleToggleComments(post)}
                      className="flex items-center space-x-2 text-blue-200 hover:text-blue-400 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Comment</span>
                    </motion.button>
                  </div>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <div className="mt-4 border-t border-white/20 pt-4">
                    {/* Comment Input - Always at top */}
                    <div className="flex space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user?.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={commentTexts[post.id] || ''}
                          onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                          placeholder="Write a comment..."
                          className="w-full p-3 bg-white/20 text-white placeholder-blue-200 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          onKeyPress={(e) => e.key === 'Enter' && handleComment(post)}
                        />
                      </div>
                      <motion.button
                        onClick={() => handleComment(post)}
                        disabled={!commentTexts[post.id]?.trim()}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          commentTexts[post.id]?.trim() 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-500 cursor-not-allowed text-gray-300'
                        }`}
                        whileHover={commentTexts[post.id]?.trim() ? { scale: 1.05 } : {}}
                        whileTap={commentTexts[post.id]?.trim() ? { scale: 0.95 } : {}}
                      >
                        Post
                      </motion.button>
                    </div>
                    {/* Display existing comments */}
                    {loadingComments[post.id] ? (
                      <div className="text-blue-200 text-sm">Loading comments...</div>
                    ) : commentsByPostId[post.id] && commentsByPostId[post.id].length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-blue-200 text-sm font-semibold">Comments ({commentsByPostId[post.id].length})</h4>
                        {commentsByPostId[post.id].map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {comment.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-white text-sm">{comment.text}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-blue-200 text-xs">{comment.user_name} • {formatDate(comment.created_at)}</span>
                                  <motion.button
                                    onClick={() => {
                                      if (post.type === 'review') {
                                        toggleUpvoteComment(comment.id);
                                      } else {
                                        toggleUpvoteQuoteComment(comment.id);
                                      }
                                    }}
                                    className="flex items-center space-x-1 text-blue-200 hover:text-red-400 transition-colors text-xs"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                    <span>{comment.upvotes}</span>
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-blue-300 text-sm">No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostsPage;
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getUserProfile, getPublicReviews, getQuotes, getMyProfile } from './../api/api';


const Profile: React.FC = () => {
  type ProfileParams = { readerId?: string };
const { readerId } = useParams<ProfileParams>();
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        
        // Determine if this is the current user's profile or someone else's
        const currentUserId = localStorage.getItem('userId');
        const targetReaderId = readerId || currentUserId;
        
        if (!targetReaderId) {
          throw new Error('User not found');
        }

        setIsOwnProfile(!readerId || readerId === currentUserId);

        // Fetch profile data
        const profileData = readerId 
          ? await getUserProfile(readerId)
          : await getMyProfile();

        setProfile(profileData);

        // Fetch user's posts (reviews and quotes)
        const [reviewsData, quotesData] = await Promise.all([
          getPublicReviews(),
          getQuotes(),
        ]);

        // Filter posts by this user
        const userReviews = reviewsData.reviews.filter((review: any) => 
          review.reader_id === targetReaderId
        );
        const userQuotes = quotesData.quotes.filter((quote: any) => 
          quote.reader_id === targetReaderId
        );

        const combinedPosts = [
          ...userReviews.map((review: any) => ({
            ...review,
            type: 'review',
            id: `review-${review.isbn}-${review.created_at}`,
            created_at: review.created_at
          })),
          ...userQuotes.map((quote: any) => ({
            ...quote,
            type: 'quote',
            id: `quote-${quote.id}`,
            created_at: quote.created_at
          }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setUserPosts(combinedPosts);

      } catch (error: any) {
        console.error('Profile data fetch error:', error);
        setError(error.message || 'Error loading profile data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [readerId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-indigo-950 to-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">Loading profile...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-indigo-950 to-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-500 text-xl">{error}</div>
          <div className="text-center mt-4">
            <Link to="/" className="text-emerald-400 hover:text-emerald-300">
              Return to Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="py-20 bg-gradient-to-b from-indigo-950 to-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">Profile not found</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-indigo-950 to-black min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          
          {/* Profile Header */}
          <motion.div variants={itemVariants} className="bg-slate-900 p-8 rounded-2xl shadow-xl mb-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg">
              {profile.name?.[0]?.toUpperCase() || 'R'}
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">{profile.name}</h1>
            <div className="flex justify-center items-center gap-4 mb-4">
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {profile.class_tag || 'Reader'}
              </span>
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Rank: {profile.rank_score || 0}
              </span>
              {isOwnProfile && (
                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Your Profile
                </span>
              )}
            </div>
            <p className="text-gray-300">
              Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '2024'}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900 p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-2">{profile.books_read || 0}</div>
              <div className="text-gray-300 font-medium">Books Read</div>
            </div>
            
            <div className="bg-slate-900 p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{profile.badges?.length || 0}</div>
              <div className="text-gray-300 font-medium">Badges Earned</div>
            </div>
            
            <div className="bg-slate-900 p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {profile.borrow_history?.filter((book: any) => !book.returned).length || 0}
              </div>
              <div className="text-gray-300 font-medium">Currently Reading</div>
            </div>
          </motion.div>

          {/* Badges Section */}
          {profile.badges && profile.badges.length > 0 && (
            <motion.div variants={itemVariants} className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Achievements & Badges</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {profile.badges.map((badge: string, index: number) => (
                  <div key={index} className="bg-gradient-to-br from-emerald-600 to-green-700 p-4 rounded-xl shadow-lg text-center text-white transform hover:scale-105 transition-transform duration-200">
                    <div className="text-2xl mb-2">🏆</div>
                    <p className="text-sm font-medium">{badge}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Reading History */}
          {profile.borrow_history && profile.borrow_history.length > 0 && (
            <motion.div variants={itemVariants} className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Reading History</h2>
              <div className="space-y-4">
                {profile.borrow_history.map((book: any, index: number) => (
                  <div key={index} className="bg-slate-900 p-5 rounded-xl shadow-lg border-l-4 border-emerald-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{book.book_title}</h3>
                        <p className="text-gray-300 text-sm">
                          Borrowed: {new Date(book.borrow_date).toLocaleDateString()}
                        </p>
                        {book.returned && book.return_date && (
                          <p className="text-gray-300 text-sm">
                            Returned: {new Date(book.return_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        book.returned 
                          ? 'bg-green-600 text-white' 
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {book.returned ? 'Completed' : 'Currently Reading'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* User Posts */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {isOwnProfile ? 'Your Posts' : `${profile.name}'s Posts`}
            </h2>
            
            {userPosts.length === 0 ? (
              <div className="text-center bg-slate-900 p-8 rounded-xl shadow-lg">
                <p className="text-gray-300 text-lg mb-4">
                  {isOwnProfile 
                    ? "You haven't posted any reviews or quotes yet." 
                    : "This user hasn't posted any reviews or quotes yet."
                  }
                </p>
                {isOwnProfile && (
                  <Link 
                    to="/explore-books" 
                    className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                  >
                    Explore Books to Get Started
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {userPosts.map((post) => (
                  <div key={post.id} className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-700">
                    {post.type === 'review' ? (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-white font-semibold text-lg">Book Review</h3>
                          <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Review
                          </span>
                        </div>
                        <p className="text-gray-300 mb-4 leading-relaxed">{post.review_text}</p>
                        <div className="flex justify-between items-center text-sm text-gray-400">
                          <span>ISBN: {post.isbn}</span>
                          <div className="flex items-center gap-4">
                            <span>👍 {post.upvotes || 0} upvotes</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-white font-semibold text-lg">Inspiring Quote</h3>
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Quote
                          </span>
                        </div>
                        <blockquote className="text-white italic text-xl mb-4 leading-relaxed border-l-4 border-blue-500 pl-4">
                          "{post.text}"
                        </blockquote>
                        <div className="flex justify-between items-center text-sm text-gray-400">
                          <span>By {post.user_name || profile.name}</span>
                          <div className="flex items-center gap-4">
                            <span>👍 {post.upvotes || 0} upvotes</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Profile;
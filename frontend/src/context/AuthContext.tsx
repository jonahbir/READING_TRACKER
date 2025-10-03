import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { getUserProfile } from '../api/api';

interface User {
  id: string;
  name: string;
  email: string;
  reader_id: string;
  role: string;
  rank_score: number;
  books_read: number;
  class_tag: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoggedIn: false,
  setToken: () => {},
  setUser: () => {},
  logout: () => {},
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('jwtToken'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('jwtToken', newToken);
    } else {
      localStorage.removeItem('jwtToken');
      setUser(null);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwtToken');
  };

  const isLoggedIn = !!token && !!user;

  useEffect(() => {
    const fetchUserProfile = async () => {
      const storedToken = localStorage.getItem('jwtToken');
      
      if (storedToken && !user) {
        try {
          // Fetch user profile using the stored token
          const userProfile = await getUserProfile();
          
          // Transform the API response to match our User interface
          setUser({
            id: userProfile.reader_id,
            name: userProfile.name,
            email: userProfile.email || '',
            reader_id: userProfile.reader_id,
            role: 'user', // Default role, adjust based on your API if needed
            rank_score: userProfile.rank_score || 0,
            books_read: userProfile.books_read || 0,
            class_tag: userProfile.class_tag || ''
          });
          
          setTokenState(storedToken); // Ensure token state is synced
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // If token is invalid, clear it
          localStorage.removeItem('jwtToken');
          setTokenState(null);
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []); // Empty dependency array - runs only on mount

  // Also handle the case when token exists but user data needs to be fetched
  useEffect(() => {
    if (token && !user) {
      const fetchUserData = async () => {
        try {
          const userProfile = await getUserProfile();
          setUser({
            id: userProfile.reader_id,
            name: userProfile.name,
            email: userProfile.email || '',
            reader_id: userProfile.reader_id,
            role: 'user',
            rank_score: userProfile.rank_score || 0,
            books_read: userProfile.books_read || 0,
            class_tag: userProfile.class_tag || ''
          });
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          logout(); // Logout if we can't fetch user data
        }
      };

      fetchUserData();
    }
  }, [token, user]);

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      isLoggedIn, 
      setToken, 
      setUser, 
      logout,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
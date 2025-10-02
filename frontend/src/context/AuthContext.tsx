import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

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
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoggedIn: false,
  setToken: () => {},
  setUser: () => {},
  logout: () => {},
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
    // If we have a token but no user, we should fetch user profile
    if (token && !user) {
      // This will be implemented when we create the getUserProfile API function
      console.log('Token exists but no user data - should fetch user profile');
    }
  }, [token, user]);

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn, setToken, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
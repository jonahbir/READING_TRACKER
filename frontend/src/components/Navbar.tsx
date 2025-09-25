import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { token, setToken } = useContext(AuthContext);

  const handleLogout = () => {
    setToken(null);
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-black">
        Reading Tracker
      </Link>
      <div className="space-x-4">
        <Link to="/" className="text-black hover:text-githubGreen">
          Home
        </Link>
        {token ? (
          <>
            <Link to="/profile" className="text-black hover:text-githubGreen">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-black hover:text-githubGreen"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-black hover:text-githubGreen">
              Login
            </Link>
            <Link to="/register" className="text-black hover:text-githubGreen">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toggleMenu();
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold">
            Land Registry
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="hover:text-secondary transition-colors">
              Home
            </Link>
            <Link to="/about" className="hover:text-secondary transition-colors">
              About
            </Link>
            <Link to="/services" className="hover:text-secondary transition-colors">
              Services
            </Link>
            <Link to="/contact" className="hover:text-secondary transition-colors">
              Contact
            </Link>

            {isAuthenticated() ? (
              <div className="relative group">
                <button className="hover:text-secondary transition-colors">
                  {user.fullName}
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <Link
                    to={`/dashboard/${user.role}`}
                    className="block px-4 py-2 text-gray-800 hover:bg-primary-lighter hover:text-white"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-800 hover:bg-primary-lighter hover:text-white"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-accent hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login/land-officer"
                  className="hover:text-secondary transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/admin-login"
                  className="hover:text-secondary transition-colors"
                >
                  Admin
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMenu}
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden mt-4 space-y-3 pb-3">
            <Link
              to="/"
              className="block hover:text-secondary transition-colors"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="block hover:text-secondary transition-colors"
              onClick={toggleMenu}
            >
              About
            </Link>
            <Link
              to="/services"
              className="block hover:text-secondary transition-colors"
              onClick={toggleMenu}
            >
              Services
            </Link>
            <Link
              to="/contact"
              className="block hover:text-secondary transition-colors"
              onClick={toggleMenu}
            >
              Contact
            </Link>

            {isAuthenticated() ? (
              <>
                <div className="mb-3 px-2 py-1 bg-primary-dark rounded-md">
                  <span>{user.fullName}</span>
                </div>
                <Link
                  to={`/dashboard/${user.role}`}
                  className="block hover:text-secondary transition-colors"
                  onClick={toggleMenu}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="block hover:text-secondary transition-colors"
                  onClick={toggleMenu}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-accent hover:text-white hover:bg-accent px-2 py-1 rounded mt-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  className="block hover:text-secondary transition-colors py-1"
                  onClick={toggleMenu}
                >
                  User Login
                </Link>
                <Link
                  to="/admin-login"
                  className="block hover:text-secondary transition-colors py-1"
                  onClick={toggleMenu}
                >
                  Admin Login
                </Link>
                <div className="border-t border-gray-200 my-2 pt-2"></div>
                <Link
                  to="/register"
                  className="bg-secondary text-white px-4 py-1 rounded-md hover:bg-secondary-dark transition-colors inline-block text-center"
                  onClick={toggleMenu}
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;

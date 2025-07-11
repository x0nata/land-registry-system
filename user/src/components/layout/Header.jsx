import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const dropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);          // Always close the mobile menu
    setIsDropdownOpen(false);  // Close the dropdown
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={toggleDropdown}
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
                  className="hover:text-secondary transition-colors px-4 py-2 rounded focus:outline-none"
                >
                  {user?.fullName || "Account"}
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/dashboard/user"
                      className="block px-4 py-2 text-gray-800 hover:bg-primary-lighter hover:text-white"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-800 hover:bg-primary-lighter hover:text-white"
                      onClick={() => setIsDropdownOpen(false)}
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
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className="hover:text-secondary transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="hover:text-secondary transition-colors"
                >
                  Register
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
                  to="/dashboard/user"
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
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block hover:text-secondary transition-colors py-1"
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

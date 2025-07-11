import { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import * as authService from '../services/authService';
import AuthPopups from '../components/auth/AuthPopups';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  // Load user from localStorage or sessionStorage on initial render
  useEffect(() => {
    // Try to get user from localStorage first (for "remember me")
    let storedUser = localStorage.getItem('user');

    // If not in localStorage, try sessionStorage
    if (!storedUser) {
      storedUser = sessionStorage.getItem('user');
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        // Clear invalid storage
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // Login function with support for different user types
  const login = async (email, password, userType = 'user', rememberMe = false) => {
    try {
      let userData;

      // Choose the appropriate login method based on user type
      switch (userType) {
        case 'admin':
          userData = await authService.loginAdmin(email, password);
          break;
        case 'landOfficer':
          userData = await authService.loginLandOfficer(email, password);
          break;
        case 'user':
        default:
          userData = await authService.login(email, password);
          break;
      }

      // Store user data in localStorage or sessionStorage based on rememberMe
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(userData));
        // Remove from sessionStorage if it exists
        sessionStorage.removeItem('user');
      } else {
        sessionStorage.setItem('user', JSON.stringify(userData));
        // Remove from localStorage if it exists
        localStorage.removeItem('user');
      }

      // Update state
      setUser(userData);

      // Show login success popup
      setShowLoginSuccess(true);
      setTimeout(() => setShowLoginSuccess(false), 3000);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed. Please check your credentials.',
        error: error.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  // This function is now replaced by loginWithUserObject

  // Register function
  const register = async (userData) => {
    try {
      // Make API call to register
      const result = await authService.register(userData);

      // Don't show toast here - let the component handle it
      // This prevents duplicate toasts

      return { success: true, user: result };
    } catch (error) {
      console.error('Registration error in context:', error);

      // Extract error message from various possible error formats
      let errorMessage = 'Registration failed';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Don't show toast here - let the component handle it

      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    // Remove user data from both localStorage and sessionStorage
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');

    // Reset user state
    setUser(null);

    // Show logout success popup
    setShowLogoutSuccess(true);
    setTimeout(() => setShowLogoutSuccess(false), 3000);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  // Direct login with user object (used for admin login)
  const loginWithUserObject = (userObj, rememberMe = true) => {
    try {
      // Store user data in localStorage or sessionStorage based on rememberMe
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(userObj));
        // Remove from sessionStorage if it exists
        sessionStorage.removeItem('user');
      } else {
        sessionStorage.setItem('user', JSON.stringify(userObj));
        // Remove from localStorage if it exists
        localStorage.removeItem('user');
      }

      // Update state
      setUser(userObj);

      // Show login success popup
      setShowLoginSuccess(true);
      setTimeout(() => setShowLoginSuccess(false), 3000);

      return { success: true, user: userObj };
    } catch (error) {
      console.error('Login with user object error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  // Context value
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    loginWithUserObject,
    // Popup states
    showLoginSuccess,
    showLogoutSuccess
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      <AuthPopups
        showLoginSuccess={showLoginSuccess}
        showLogoutSuccess={showLogoutSuccess}
        user={user}
      />
    </AuthContext.Provider>
  );
};

export default AuthContext;

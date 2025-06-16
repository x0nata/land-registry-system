import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  // Update document title
  useEffect(() => {
    document.title = 'Admin Login | Property Registration System';
    return () => {
      document.title = 'Property Registration System';
    };
  }, []);

  // If user is already logged in as admin, redirect to admin dashboard or the page they were trying to access
  useEffect(() => {
    if (user && user.role === 'admin') {
      // Check if there's a redirect path in the location state
      const redirectPath = location.state?.from?.pathname || '/admin/dashboard';
      console.log('Admin already logged in, redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      // Use the admin login API endpoint
      const result = await login(username, password, 'admin');

      if (result.success) {
        // Get the redirect path from location state or use default
        const from = location.state?.from?.pathname || '/admin/dashboard';

        // Navigate to the redirect path
        navigate(from, { replace: true });
      } else {
        toast.error(result.message || 'Invalid admin credentials');
        setLoading(false);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error(error.message || 'Failed to login as admin');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access the administrative dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="username"
                name="username"
                type="email"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="admin@system.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-primary-dark group-hover:text-primary-lighter" aria-hidden="true" />
              </span>
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : 'Sign in as Admin'}
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm">
              <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                User Login
              </Link>
            </div>
            <div className="text-sm">
              <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
                Register
              </Link>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-sm text-blue-700">
              <strong>Admin Login:</strong><br />
              Use your admin account credentials to access the administrative dashboard.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              If you don't have admin credentials, contact your system administrator.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

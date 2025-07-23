import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-6xl font-bold text-ethiopian-green mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-gray-600 text-center max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Link
          to="/"
          className="btn-primary px-6 py-3 rounded-md"
        >
          Return to Home
        </Link>

        {/* Dashboard navigation based on user role */}
        {isAuthenticated() && user && (
          <>
            {user.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className="bg-secondary hover:bg-secondary-dark text-white px-6 py-3 rounded-md transition-colors font-medium"
              >
                Go to Admin Dashboard
              </Link>
            )}
            {user.role === 'landOfficer' && (
              <Link
                to="/landofficer/dashboard"
                className="bg-secondary hover:bg-secondary-dark text-white px-6 py-3 rounded-md transition-colors font-medium"
              >
                Go to Land Officer Dashboard
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotFound;

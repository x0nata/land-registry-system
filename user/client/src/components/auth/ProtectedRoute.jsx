import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, hasRole, loading, user } = useAuth();
  const location = useLocation();

  // If authentication is still loading, show nothing
  if (loading) {
    return null;
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role (only 'user' role allowed)
  if (allowedRoles && !hasRole(allowedRoles)) {
    // If user is not a regular user, redirect to home
    return <Navigate to="/" replace />;
  }

  // Block admin and land officer roles from accessing the system
  if (user && (user.role === 'admin' || user.role === 'landOfficer')) {
    return <Navigate to="/" replace />;
  }

  // Render the protected component
  return <Outlet />;
};

export default ProtectedRoute;

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
    // Redirect to appropriate login page based on the route
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin-login" state={{ from: location }} replace />;
    } else if (location.pathname.startsWith('/landofficer')) {
      return <Navigate to="/login/land-officer" state={{ from: location }} replace />;
    } else {
      // Default redirect for any other unauthenticated access, likely to land officer login
      return <Navigate to="/login/land-officer" state={{ from: location }} replace />;
    }
  }

  // Check if user has the required role
  if (allowedRoles && !hasRole(allowedRoles)) {
    // Redirect to appropriate dashboard based on user role
    if (user && user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user && user.role === 'landOfficer') {
      return <Navigate to="/landofficer/dashboard" replace />;
    } else {
      // If role doesn't match and it's not admin or landOfficer, redirect to land officer login
      return <Navigate to="/login/land-officer" state={{ from: location }} replace />;
    }
  }

  // Render the protected component
  return <Outlet />;
};

export default ProtectedRoute;

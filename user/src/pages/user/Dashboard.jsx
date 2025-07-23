import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon, DocumentTextIcon, HomeIcon, CurrencyDollarIcon, MagnifyingGlassIcon, TrashIcon, PencilIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import StatisticsOverview from '../../components/dashboard/StatisticsOverview';
import DashboardSearch from '../../components/dashboard/DashboardSearch';
import RecentActivity from '../../components/dashboard/RecentActivity';
import DocumentManager from '../../components/document/DocumentManager';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import PropertyEditModal from '../../components/property/PropertyEditModal';
import { toast } from 'react-toastify';
import { getUserProperties, deleteProperty } from '../../services/propertyService';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { notifications, addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDocumentManager, setShowDocumentManager] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [hasShownError, setHasShownError] = useState(false);

  // Empty property data
  const [properties, setProperties] = useState([]);

  // Empty applications data
  const [applications, setApplications] = useState([]);

  // Empty payments data
  const [payments, setPayments] = useState([]);

  // Ref to prevent multiple simultaneous calls
  const loadingRef = useRef(false);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle property deletion
  const handleDeleteProperty = (property) => {
    setSelectedProperty(property);
    setShowDeleteModal(true);
  };

  const confirmDeleteProperty = async () => {
    try {
      await deleteProperty(selectedProperty._id || selectedProperty.id);
      setShowDeleteModal(false);
      setSelectedProperty(null);

      // Reload dashboard data using centralized function
      await refreshDashboardData();

      toast.success('Property application deleted successfully');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property application');
    }
  };

  // Handle document manager toggle
  const toggleDocumentManager = (propertyId) => {
    setShowDocumentManager(showDocumentManager === propertyId ? null : propertyId);
  };

  // Handle document changes (refresh property data)
  const handleDocumentChange = async () => {
    try {
      await refreshDashboardData();
    } catch (error) {
      console.error('Error refreshing properties:', error);
    }
  };

  // Handle property edit
  const handleEditProperty = (property) => {
    // Double-check that property can be edited
    if (!['pending', 'rejected', 'needs_update'].includes(property.status)) {
      toast.error(`Cannot edit property with status: ${property.status}`);
      return;
    }

    setSelectedProperty(property);
    setShowEditModal(true);
  };

  const handleEditSuccess = async () => {
    setShowEditModal(false);
    setSelectedProperty(null);

    // Reload dashboard data using centralized function
    try {
      await refreshDashboardData();
    } catch (error) {
      console.error('Error refreshing properties:', error);
    }
  };

  // Update document title
  useEffect(() => {
    document.title = 'User Dashboard | Property Registration System';
    return () => {
      document.title = 'Property Registration System';
    };
  }, []);

  // Calculate dashboard statistics from properties data
  const calculateDashboardStats = useCallback((propertiesArray) => {
    // Calculate total payment amount from properties with payments
    const totalPaymentAmount = propertiesArray.reduce((total, property) => {
      if (property.payments && Array.isArray(property.payments)) {
        // Sum up payment amounts if available
        const propertyPayments = property.payments.reduce((sum, payment) => {
          return sum + (payment.amount || 0);
        }, 0);
        return total + propertyPayments;
      }
      return total;
    }, 0);

    return {
      totalProperties: propertiesArray.length,
      pendingApplications: propertiesArray.filter(prop =>
        prop.status === 'pending' ||
        prop.status === 'documents_pending' ||
        prop.status === 'documents_validated' ||
        prop.status === 'payment_pending'
      ).length,
      completedApplications: propertiesArray.filter(prop => prop.status === 'approved').length,
      totalPayments: totalPaymentAmount
    };
  }, []);

  // Centralized function to load and update dashboard data
  const loadDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log('Already loading dashboard data, skipping...');
      return;
    }

    try {
      loadingRef.current = true;
      setHasShownError(false);

      console.log('Loading dashboard data...');

      // Fetch user's properties
      const propertiesArray = await getUserProperties();
      console.log('Fetched user properties:', propertiesArray);

      // Set properties data
      setProperties(propertiesArray);

      // Calculate and set dashboard stats
      const stats = calculateDashboardStats(propertiesArray);
      setDashboardStats(stats);

      // Add welcome notification (only once per hour)
      if (user) {
        const lastWelcomeKey = `lastWelcome_${user._id || user.id}`;
        const lastWelcomeTime = localStorage.getItem(lastWelcomeKey);
        const now = new Date().getTime();
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

        if (!lastWelcomeTime || (now - parseInt(lastWelcomeTime)) > oneHour) {
          // Show different message for new users with no properties
          const welcomeMessage = propertiesArray.length === 0
            ? `Hello ${user.fullName}, welcome to your property dashboard! Start by registering your first property.`
            : `Hello ${user.fullName}, welcome back to your property dashboard.`;

          addNotification({
            title: propertiesArray.length === 0 ? 'Welcome to Land Registry!' : 'Welcome back!',
            message: welcomeMessage,
            type: 'info',
            showToast: false
          });
          localStorage.setItem(lastWelcomeKey, now.toString());
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);

      // Only show error toast once per component instance
      if (!hasShownError) {
        toast.error('Failed to load dashboard data');
        setHasShownError(true);
      }

      // Set empty arrays as fallback
      setProperties([]);
      setDashboardStats({
        totalProperties: 0,
        pendingApplications: 0,
        completedApplications: 0,
        totalPayments: 0
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user, calculateDashboardStats, addNotification, hasShownError]);

  // Function to refresh dashboard data without showing loading state
  const refreshDashboardData = async () => {
    try {
      // Fetch user's properties
      const propertiesArray = await getUserProperties();
      console.log('Refreshed user properties:', propertiesArray);

      // Set properties data
      setProperties(propertiesArray);

      // Calculate and set dashboard stats
      const stats = calculateDashboardStats(propertiesArray);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      throw error; // Re-throw to allow calling functions to handle the error
    }
  };

  // Check authentication and load dashboard data
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: '/dashboard/user' } } });
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, navigate, loadDashboardData]); // Added loadDashboardData to dependencies

  // Import the LoadingSpinner component
  const LoadingSpinner = React.lazy(() => import('../../components/common/LoadingSpinner'));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <React.Suspense fallback={<div>Loading...</div>}>
          <LoadingSpinner size="large" fullScreen={false} text="Loading dashboard..." />
        </React.Suspense>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="mb-6">You need to be logged in to view this page.</p>
        <Link to="/login" className="btn-primary px-6 py-2 rounded-md">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold mb-6">User Dashboard</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Welcome, {user.fullName || 'User'}</h2>
            <p className="text-gray-600">Manage your properties and applications</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="relative">
              <Link to="/notifications" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <BellIcon className="h-5 w-5 text-gray-700" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-accent rounded-full">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </Link>
            </div>

            <Link
              to="/property/register"
              className="btn-primary px-4 py-2 rounded-md flex items-center"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Register New Property
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Search */}
      <div className="mb-8">
        <DashboardSearch
          placeholder="Search your properties, applications..."
          searchType="user"
          className="w-full"
        />
      </div>

      {/* Dashboard Statistics */}
      <StatisticsOverview userRole="user" stats={dashboardStats} />

      {/* Recent Activity */}
      <div className="mb-8">
        <RecentActivity
          limit={8}
          showFilters={true}
          showHeader={true}
          userSpecific={true}
          className=""
        />
      </div>

      {/* Properties, Activity and Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Properties */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">My Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <HomeIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Yet</h3>
                <p className="text-gray-500 mb-4">You haven't registered any properties yet.</p>
                <Link
                  to="/property/register"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  <HomeIcon className="h-5 w-5 mr-2" />
                  Register Your First Property
                </Link>
              </div>
            ) : (
              properties.map((property) => (
                <div key={property._id || property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{property.plotNumber}</h4>
                      <p className="text-gray-600">
                        {property.location.subCity} Sub-city, Kebele {property.location.kebele}
                      </p>
                      <p className="text-gray-600">
                        Area: {property.area} sqm | Type: <span className="capitalize">{property.propertyType}</span>
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(property.status)} capitalize`}>
                      {property.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Document Status */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Documents: {property.documents?.length || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleDocumentManager(property._id || property.id)}
                      className="text-primary hover:text-primary-dark text-sm flex items-center"
                    >
                      <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                      Manage Documents
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="flex space-x-2">
                      <Link
                        to={`/property/${property._id || property.id}`}
                        className="text-primary hover:text-primary-dark text-sm flex items-center"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Link>

                      {['pending', 'rejected', 'needs_update'].includes(property.status) ? (
                        <>
                          <button
                            onClick={() => handleEditProperty(property)}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(property)}
                            className="text-red-600 hover:text-red-800 text-sm flex items-center"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-500 text-sm flex items-center">
                          <PencilIcon className="h-4 w-4 mr-1 opacity-50" />
                          <span className="opacity-75">
                            {property.status === 'approved' ? 'Approved - Cannot Edit' :
                             property.status === 'under_review' ? 'Under Review - Cannot Edit' :
                             'Cannot Edit'}
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(property.registrationDate)}
                    </span>
                  </div>

                  {/* Document Manager */}
                  {showDocumentManager === (property._id || property.id) && (
                    <div className="mt-4 pt-4 border-t bg-gray-50 -mx-4 -mb-4 p-4 rounded-b-lg">
                      <DocumentManager
                        propertyId={property._id || property.id}
                        onDocumentChange={handleDocumentChange}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
            <div className="mt-6 text-right">
              <Link to="/properties" className="text-primary hover:underline">
                View All Properties
              </Link>
            </div>
          </div>


        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Notifications</h3>
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
              {notifications.filter(n => !n.read).length} new
            </span>
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            ) : (
              notifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{notification.title}</h4>
                    <span className="text-xs text-gray-500">{formatDate(notification.date)}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{notification.message}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/notifications"
              className="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProperty && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedProperty(null);
          }}
          onConfirm={confirmDeleteProperty}
          title="Delete Property Application"
          message={`Are you sure you want to delete the property application for "${selectedProperty.plotNumber}"? This action cannot be undone and will remove all associated documents.`}
          confirmText="Delete Application"
        />
      )}

      {/* Property Edit Modal */}
      {showEditModal && selectedProperty && (
        <PropertyEditModal
          property={selectedProperty}
          onSuccess={handleEditSuccess}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProperty(null);
          }}
        />
      )}
    </div>
  );
};

export default UserDashboard;

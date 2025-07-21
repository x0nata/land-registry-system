import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import DashboardSearch from '../../components/dashboard/DashboardSearch';
import { getPendingProperties } from '../../services/propertyService';
import { getPendingDocuments, verifyDocument, rejectDocument } from '../../services/documentService';
import { getPropertyStats, getDocumentStats } from '../../services/reportsService';
import {
  trackDashboardLoad,
  trackStatsLoad,
  trackPendingAppsLoad,
  trackPendingDocsLoad,
  finishDashboardLoad,
  finishStatsLoad,
  finishPendingAppsLoad,
  finishPendingDocsLoad
} from '../../utils/performanceMonitor';
import {
  getCachedPropertyStats,
  cachePropertyStats,
  getCachedDocumentStats,
  cacheDocumentStats,
  getCachedPendingProperties,
  cachePendingProperties,
  getCachedPendingDocuments,
  cachePendingDocuments,
  invalidatePropertyCaches,
  invalidateDocumentCaches
} from '../../utils/dataCache';

// Lazy load RecentActivity component for better performance
const RecentActivity = lazy(() => import('../../components/dashboard/RecentActivity'));

const LandOfficerDashboard = () => {
  // Use AuthContext for user data and authentication
  const { user, loading } = useAuth();

  // Debug logging
  console.log('🏠 LandOfficerDashboard - User:', user);
  console.log('🏠 LandOfficerDashboard - Loading:', loading);
  console.log('🏠 LandOfficerDashboard - User Role:', user?.role);

  // Individual loading states for progressive loading
  const [statsLoading, setStatsLoading] = useState(true);
  const [pendingAppsLoading, setPendingAppsLoading] = useState(true);
  const [pendingDocsLoading, setPendingDocsLoading] = useState(true);

  // Error states for better error handling
  const [pendingAppsError, setPendingAppsError] = useState(null);
  const [pendingDocsError, setPendingDocsError] = useState(null);

  // Real data from API
  const [pendingApplications, setPendingApplications] = useState([]);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    pendingProperties: 0,
    approvedProperties: 0,
    rejectedProperties: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    verifiedDocuments: 0,
    rejectedDocuments: 0
  });

  // Modal states for document verification
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');

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
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'needs_update':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get document type display name
  const getDocumentTypeDisplay = (type) => {
    switch (type) {
      case 'title_deed':
        return 'Title Deed';
      case 'id_copy':
        return 'National ID';
      case 'application_form':
        return 'Application Form';
      case 'tax_clearance':
        return 'Tax Clearance';
      default:
        return type.replace('_', ' ');
    }
  };

  // Load user data from localStorage
  // Remove manual user loading since we're using AuthContext

  // Load dashboard data
  useEffect(() => {
    console.log('🔄 Dashboard useEffect triggered - User:', user);
    console.log('🔄 Dashboard useEffect - User role:', user?.role);

    // Load dashboard data if we have a user (regardless of role for now)
    // This ensures the dashboard shows content even if there are role issues
    if (user) {
      console.log('✅ Loading dashboard data for user:', user.role);
      loadDashboardData();

      // Add a safety timeout to prevent infinite loading (reduced to 8 seconds)
      const loadingTimeout = setTimeout(() => {
        console.warn('⚠️ Dashboard loading timeout reached, forcing completion');
        setStatsLoading(false);
        setPendingAppsLoading(false);
        setPendingDocsLoading(false);
      }, 8000); // 8 seconds maximum loading time (reduced from 15s)

      return () => clearTimeout(loadingTimeout);
    } else if (!loading) {
      // If not loading and no user, still show dashboard with error message
      console.log('❌ No user available, showing dashboard with error message');
      setStatsLoading(false);
      setPendingAppsLoading(false);
      setPendingDocsLoading(false);
    }
  }, [user, loading]);

  // Load dashboard data with parallel async operations for better performance
  const loadDashboardData = async () => {
    try {
      trackDashboardLoad();

      // Load critical stats first
      loadStats();

      // Load other data in parallel without blocking the UI
      loadPendingApplications();
      loadPendingDocuments();

      // Track completion after all initial loads
      setTimeout(() => {
        finishDashboardLoad();
      }, 100);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  // Load stats independently with caching
  const loadStats = async () => {
    try {
      trackStatsLoad();
      setStatsLoading(true);

      // Check cache first
      const cachedPropertyStats = getCachedPropertyStats();
      const cachedDocumentStats = getCachedDocumentStats();

      if (cachedPropertyStats && cachedDocumentStats) {
        // Use cached data
        setStats({
          totalProperties: cachedPropertyStats.totalProperties || 0,
          pendingProperties: cachedPropertyStats.pendingProperties || 0,
          approvedProperties: cachedPropertyStats.approvedProperties || 0,
          rejectedProperties: cachedPropertyStats.rejectedProperties || 0,
          totalDocuments: cachedDocumentStats.totalDocuments || 0,
          pendingDocuments: cachedDocumentStats.pendingVerification || 0,
          verifiedDocuments: cachedDocumentStats.verifiedDocuments || 0,
          rejectedDocuments: cachedDocumentStats.rejectedDocuments || 0
        });
        console.log('📦 Using cached stats data');
      } else {
        // Fetch fresh data with dashboard optimization and fallback
        console.log('🔄 Loading fresh stats data with dashboard optimization...');

        let propertyStats, documentStats;

        try {
          // Try with dashboard optimization first
          [propertyStats, documentStats] = await Promise.all([
            getPropertyStats({ dashboard: true }),
            getDocumentStats({ dashboard: true })
          ]);
        } catch (dashboardError) {
          console.warn('⚠️ Dashboard-optimized stats failed, falling back to regular stats:', dashboardError);

          // Fallback to regular stats API
          try {
            [propertyStats, documentStats] = await Promise.all([
              getPropertyStats(),
              getDocumentStats()
            ]);
          } catch (fallbackError) {
            console.error('❌ Both dashboard and regular stats failed:', fallbackError);

            // Use default values if both fail
            propertyStats = {
              totalProperties: 0,
              pendingProperties: 0,
              approvedProperties: 0,
              rejectedProperties: 0
            };
            documentStats = {
              totalDocuments: 0,
              pendingVerification: 0,
              verifiedDocuments: 0,
              rejectedDocuments: 0
            };

            // Show a non-intrusive warning
            console.warn('📊 Using default stats values due to API errors');
          }
        }

        // Cache the results
        cachePropertyStats(propertyStats);
        cacheDocumentStats(documentStats);

        setStats({
          totalProperties: propertyStats.totalProperties || 0,
          pendingProperties: propertyStats.pendingProperties || 0,
          approvedProperties: propertyStats.approvedProperties || 0,
          rejectedProperties: propertyStats.rejectedProperties || 0,
          totalDocuments: documentStats.totalDocuments || 0,
          pendingDocuments: documentStats.pendingVerification || 0,
          verifiedDocuments: documentStats.verifiedDocuments || 0,
          rejectedDocuments: documentStats.rejectedDocuments || 0
        });

        console.log('✅ Successfully loaded and cached stats data');
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);

      // Only show toast for non-timeout errors to avoid spam
      if (!error.isTimeout && !error.isServerError) {
        toast.error(error.message || 'Failed to load statistics');
      }

      // Set default stats to prevent blank dashboard
      setStats({
        totalProperties: 0,
        pendingProperties: 0,
        approvedProperties: 0,
        rejectedProperties: 0,
        totalDocuments: 0,
        pendingDocuments: 0,
        verifiedDocuments: 0,
        rejectedDocuments: 0
      });
    } finally {
      setStatsLoading(false);
      finishStatsLoad();
    }
  };

  // Load pending applications independently with caching
  const loadPendingApplications = async () => {
    try {
      trackPendingAppsLoad();
      setPendingAppsLoading(true);
      setPendingAppsError(null);

      // Check cache first
      const cachedData = getCachedPendingProperties();
      if (cachedData) {
        setPendingApplications(cachedData);
        console.log('📦 Using cached pending applications data');
        return;
      }

      let pendingAppsResponse;

      try {
        // First try with dashboard parameter for optimized response
        console.log('🔄 Attempting to load pending applications with dashboard API...');
        pendingAppsResponse = await getPendingProperties({ dashboard: true, limit: 10 });
      } catch (dashboardError) {
        console.warn('⚠️ Dashboard API failed, falling back to regular API:', dashboardError);

        // Fallback to regular API without dashboard parameter
        try {
          pendingAppsResponse = await getPendingProperties({ limit: 10 });
          // If regular API returns paginated response, extract properties array
          if (pendingAppsResponse?.properties) {
            pendingAppsResponse = pendingAppsResponse.properties;
          }
        } catch (fallbackError) {
          throw fallbackError; // Re-throw the fallback error
        }
      }

      cachePendingProperties(pendingAppsResponse || []);
      setPendingApplications(pendingAppsResponse || []);
      console.log('✅ Successfully loaded pending applications:', pendingAppsResponse?.length || 0, 'items');

    } catch (error) {
      console.error('❌ Error loading pending applications:', error);
      setPendingAppsError(error);

      // Enhanced error handling for different error types
      if (error.isTimeout) {
        console.log('Pending applications request timed out, using empty array');
        // Don't show error toast for timeouts, just log and continue
        setPendingApplications([]);
      } else if (error.isServerError) {
        console.log('Server error loading pending applications, using empty array');
        setPendingApplications([]);
      } else {
        toast.error(error.message || 'Failed to load pending applications');
        setPendingApplications([]);
      }
    } finally {
      setPendingAppsLoading(false);
      finishPendingAppsLoad();
    }
  };

  // Load pending documents independently with caching
  const loadPendingDocuments = async () => {
    try {
      trackPendingDocsLoad();
      setPendingDocsLoading(true);
      setPendingDocsError(null);

      // Check cache first
      const cachedData = getCachedPendingDocuments();
      if (cachedData) {
        setPendingDocuments(cachedData);
        console.log('📦 Using cached pending documents data');
        return;
      }

      let pendingDocsResponse;

      try {
        // First try with dashboard parameter for optimized response
        console.log('🔄 Attempting to load pending documents with dashboard API...');
        pendingDocsResponse = await getPendingDocuments({ dashboard: true, limit: 10 });
      } catch (dashboardError) {
        console.warn('⚠️ Dashboard API failed, falling back to regular API:', dashboardError);

        // Fallback to regular API without dashboard parameter
        try {
          pendingDocsResponse = await getPendingDocuments({ limit: 10 });
          // If regular API returns paginated response, extract documents array
          if (pendingDocsResponse?.documents) {
            pendingDocsResponse = pendingDocsResponse.documents;
          }
        } catch (fallbackError) {
          throw fallbackError; // Re-throw the fallback error
        }
      }

      cachePendingDocuments(pendingDocsResponse || []);
      setPendingDocuments(pendingDocsResponse || []);
      console.log('✅ Successfully loaded pending documents:', pendingDocsResponse?.length || 0, 'items');

    } catch (error) {
      console.error('❌ Error loading pending documents:', error);
      setPendingDocsError(error);

      // Enhanced error handling for different error types
      if (error.isTimeout) {
        console.log('Pending documents request timed out, using empty array');
        // Don't show error toast for timeouts, just log and continue
        setPendingDocuments([]);
      } else if (error.isServerError) {
        console.log('Server error loading pending documents, using empty array');
        setPendingDocuments([]);
      } else {
        toast.error(error.message || 'Failed to load pending documents');
        setPendingDocuments([]);
      }
    } finally {
      setPendingDocsLoading(false);
      finishPendingDocsLoad();
    }
  };



  // Handle document verification/rejection
  const handleDocumentAction = async () => {
    try {
      if (actionType === 'approve') {
        await verifyDocument(selectedDocument._id, notes);
        toast.success('Document verified successfully');
      } else {
        await rejectDocument(selectedDocument._id, notes);
        toast.success('Document rejected successfully');
      }

      setShowDocumentModal(false);
      setSelectedDocument(null);
      setNotes('');
      // Invalidate caches and refresh data
      invalidateDocumentCaches();
      loadPendingDocuments();
      loadStats();
    } catch (error) {
      console.error('Error processing document:', error);
      toast.error(error.message || 'Failed to process document');
    }
  };

  // Open document modal
  const openDocumentModal = (document, action) => {
    setSelectedDocument(document);
    setActionType(action);
    setShowDocumentModal(true);
  };

  // Show loading skeleton only if AuthContext is still loading AND we don't have user data
  if (loading && !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="animate-pulse">
                <div className="flex items-center mb-2">
                  <div className="h-6 w-6 bg-gray-200 rounded mr-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Always render the dashboard, but show appropriate content based on user state
  const isValidLandOfficer = user && user.role === 'landOfficer';
  const showAuthError = !loading && !user;
  const showRoleError = !loading && user && user.role !== 'landOfficer';

  if (!user || user.role !== 'landOfficer') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="mb-6">You need to be logged in as a Land Officer to view this page.</p>
        <Link to="/login/land-officer" className="btn-primary px-6 py-2 rounded-md">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold mb-6">Land Officer Dashboard</h1>

        {/* Show error messages within dashboard if needed */}
        {showAuthError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">Authentication Required</h3>
                <p className="text-red-600 text-sm">Please log in to access the dashboard.</p>
                <Link to="/login/land-officer" className="text-red-700 hover:underline text-sm">
                  Go to Login →
                </Link>
              </div>
            </div>
          </div>
        )}

        {showRoleError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-yellow-800 font-medium">Access Denied</h3>
                <p className="text-yellow-600 text-sm">You don't have permission to access this dashboard.</p>
                <p className="text-yellow-500 text-xs">Current role: {user?.role || 'Unknown'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Welcome, {user?.fullName || 'Officer'}</h2>
            <p className="text-gray-600">Manage property applications and documents</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link
              to="/landofficer/property-verification"
              className="btn-primary px-4 py-2 rounded-md flex items-center"
            >
              <DocumentTextIcon className="h-5 w-5 mr-1" />
              View Pending Applications
            </Link>
            <Link
              to="/landofficer/document-validation"
              className="bg-ethiopian-yellow text-gray-900 px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors flex items-center"
            >
              <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-1" />
              Verify Documents
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Search */}
      <div className="mb-8">
        <DashboardSearch
          placeholder="Search applications, documents, properties..."
          searchType="landOfficer"
          className="w-full"
        />
      </div>

      {/* Loading Progress Indicator */}
      {(statsLoading || pendingAppsLoading || pendingDocsLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <div className="text-sm text-blue-800">
              Loading dashboard data...
              {statsLoading && <span className="ml-2">📊 Statistics</span>}
              {pendingAppsLoading && <span className="ml-2">🏠 Applications</span>}
              {pendingDocsLoading && <span className="ml-2">📋 Documents</span>}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-2">
            <DocumentTextIcon className="h-6 w-6 text-primary mr-2" />
            <h3 className="text-lg font-semibold">Pending Applications</h3>
          </div>
          <p className="text-3xl font-bold text-primary">
            {statsLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              stats.pendingProperties || 0
            )}
          </p>
          <p className="text-gray-600 mt-1">Awaiting review</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-2">
            <ClockIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Under Review</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {pendingAppsLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              pendingApplications.filter(app => app.status === 'under_review').length || 0
            )}
          </p>
          <p className="text-gray-600 mt-1">Applications in progress</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-2">
            <DocumentMagnifyingGlassIcon className="h-6 w-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold">Documents</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {statsLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              stats.pendingDocuments || 0
            )}
          </p>
          <p className="text-gray-600 mt-1">Pending verification</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-2">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold">Approved</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {statsLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              stats.approvedProperties || 0
            )}
          </p>
          <p className="text-gray-600 mt-1">Properties verified</p>
        </div>
      </div>

      {/* Pending Applications */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Pending Applications</h3>
        {pendingAppsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : pendingAppsError && pendingAppsError.isTimeout ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Request Timed Out</h3>
            <p className="text-gray-500 mb-4">
              Loading pending applications is taking longer than expected.
            </p>
            <button
              onClick={loadPendingApplications}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        ) : pendingApplications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No pending applications found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plot Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingApplications.slice(0, 5).map((application) => (
                  <tr key={application._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {application._id?.slice(-8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.owner?.fullName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.plotNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.location?.subCity || 'N/A'}, Kebele {application.location?.kebele || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {application.propertyType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(application.status)} capitalize`}>
                        {application.status?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(application.registrationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/landofficer/property-detail-verification/${application._id}`}
                        className="text-primary hover:text-primary-dark"
                        title="Review Details"
                      >
                        Review Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 text-right">
          <Link to="/landofficer/property-verification" className="text-primary hover:underline">
            View All Pending Applications
          </Link>
        </div>
      </div>

      {/* Recent Activity and Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <Suspense fallback={
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }>
            <RecentActivity
              limit={6}
              showFilters={true}
              showHeader={true}
              className=""
              dashboard={true}
            />
          </Suspense>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/land-officer/property-verification"
              className="block w-full p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-center"
            >
              <DocumentTextIcon className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm">Verify Properties</span>
            </Link>

            <Link
              to="/land-officer/document-management"
              className="block w-full p-3 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors text-center"
            >
              <DocumentMagnifyingGlassIcon className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm">Review Documents</span>
            </Link>

            <Link
              to="/landofficer/payment-verification"
              className="block w-full p-3 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors text-center"
            >
              <CurrencyDollarIcon className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm">Verify Payments</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Documents Pending Verification */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Documents Pending Verification</h3>
        {pendingDocsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : pendingDocsError && pendingDocsError.isTimeout ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Request Timed Out</h3>
            <p className="text-gray-500 mb-4">
              Loading pending documents is taking longer than expected.
            </p>
            <button
              onClick={loadPendingDocuments}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        ) : pendingDocuments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No pending documents found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingDocuments.slice(0, 5).map((document) => (
                  <tr key={document._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {document._id?.slice(-8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {document.property?._id?.slice(-8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {document.owner?.fullName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDocumentTypeDisplay(document.documentType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {document.documentName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(document.status)} capitalize`}>
                        {document.status?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(document.uploadDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDocumentModal(document, 'approve')}
                          className="text-green-600 hover:text-green-800"
                          title="Verify"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDocumentModal(document, 'reject')}
                          className="text-red-600 hover:text-red-800"
                          title="Reject"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                        <Link
                          to="/landofficer/document-validation"
                          className="text-primary hover:text-primary-dark"
                          title="View Details"
                        >
                          <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 text-right">
          <Link to="/landofficer/document-validation" className="text-primary hover:underline">
            View All Pending Documents
          </Link>
        </div>
      </div>

      {/* Land Officer Features Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Land Officer Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <DocumentMagnifyingGlassIcon className="h-6 w-6 text-primary mr-2" />
              <h4 className="font-semibold">Property Ownership Verification</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Verify property ownership details to ensure compliance with legal standards.
              Review submitted property information and supporting documents.
            </p>
            <Link to="/landofficer/property-verification" className="mt-3 inline-block text-primary hover:underline text-sm">
              Access Verification Tools
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <DocumentTextIcon className="h-6 w-6 text-primary mr-2" />
              <h4 className="font-semibold">Document Validation</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Validate uploaded documents to confirm they meet legal and system requirements.
              Check document authenticity, format, and completeness.
            </p>
            <Link to="/landofficer/document-validation" className="mt-3 inline-block text-primary hover:underline text-sm">
              Validate Documents
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <ClockIcon className="h-6 w-6 text-primary mr-2" />
              <h4 className="font-semibold">Registration Status Updates</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Update and communicate the status of property registration requests.
              Change registration statuses based on verification results.
            </p>
            <Link to="/landofficer/property-verification" className="mt-3 inline-block text-primary hover:underline text-sm">
              Update Statuses
            </Link>
          </div>



          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <CurrencyDollarIcon className="h-6 w-6 text-primary mr-2" />
              <h4 className="font-semibold">Payment Verification</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Verify payment receipts and confirm transaction details.
              Approve or reject payments for property registration fees.
            </p>
            <Link to="/landofficer/payment-verification" className="mt-3 inline-block text-primary hover:underline text-sm">
              Verify Payments
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <ChartBarIcon className="h-6 w-6 text-primary mr-2" />
              <h4 className="font-semibold">Support for Urban Planning</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Provide data to support urban development and policy enforcement.
              Generate reports on property registrations and ownership trends.
            </p>
            <Link to="/landofficer/reports" className="mt-3 inline-block text-primary hover:underline text-sm">
              Generate Reports
            </Link>
          </div>
        </div>
      </div>



      {/* Document Verification/Rejection Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionType === 'approve' ? 'Verify Document' : 'Reject Document'}
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Document ID: {selectedDocument?._id?.slice(-8)}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Type: {getDocumentTypeDisplay(selectedDocument?.documentType)}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Owner: {selectedDocument?.owner?.fullName}
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Add verification notes (optional)' : 'Reason for rejection (required)'}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="4"
                  required={actionType === 'reject'}
                />
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDocumentModal(false);
                    setSelectedDocument(null);
                    setNotes('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDocumentAction}
                  disabled={actionType === 'reject' && !notes.trim()}
                  className={`px-4 py-2 rounded-md text-white ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionType === 'approve' ? 'Verify' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandOfficerDashboard;

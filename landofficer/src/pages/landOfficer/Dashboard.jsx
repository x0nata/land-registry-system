import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import DashboardSearch from '../../components/dashboard/DashboardSearch';
import { getPendingProperties } from '../../services/propertyService';
import { getPropertyStats, getDocumentStats } from '../../services/reportsService';
import {
  trackStatsLoad,
  trackPendingAppsLoad,
  finishStatsLoad,
  finishPendingAppsLoad
} from '../../utils/performanceMonitor';
import {
  getCachedPropertyStats,
  cachePropertyStats,
  getCachedDocumentStats,
  cacheDocumentStats,
  getCachedPendingProperties,
  cachePendingProperties
} from '../../utils/dataCache';

// Lazy load RecentActivity component for better performance
const RecentActivity = lazy(() => import('../../components/dashboard/RecentActivity'));

const LandOfficerDashboard = () => {
  // Use AuthContext for user data and authentication
  const { user, loading } = useAuth();

  // Individual loading states for progressive loading
  const [statsLoading, setStatsLoading] = useState(false); // Start as false to prevent initial loading state
  const [pendingAppsLoading, setPendingAppsLoading] = useState(false); // Start as false to prevent initial loading state

  // Error states for better error handling
  const [pendingAppsError, setPendingAppsError] = useState(null);

  // Real data from API
  const [pendingApplications, setPendingApplications] = useState([]);
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



  // Load user data from localStorage
  // Remove manual user loading since we're using AuthContext

  // Centralized function to refresh all dashboard data
  const refreshDashboardData = useCallback(async () => {
    try {
      // Load all data in parallel for better performance
      await Promise.allSettled([
        loadStats(),
        loadPendingApplications()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, []);

  // Load dashboard data - simplified to prevent duplicate calls
  useEffect(() => {
    // Only load if we have a user and auth is not loading
    if (user && !loading) {
      refreshDashboardData();

      // Add a safety timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Dashboard loading timeout reached, forcing completion');
        }
        setStatsLoading(false);
        setPendingAppsLoading(false);
      }, 8000); // Reduced to 8 seconds

      return () => clearTimeout(loadingTimeout);
    } else if (!loading && !user) {
      // If not loading and no user, show dashboard with error message
      setStatsLoading(false);
      setPendingAppsLoading(false);
    }
  }, [user, loading]); // Removed refreshDashboardData dependency to prevent re-runs



  // Load stats independently with simplified error handling
  const loadStats = useCallback(async () => {
    // Prevent duplicate calls
    if (!statsLoading) {
      setStatsLoading(true);
    } else {
      return; // Already loading, skip
    }

    try {
      trackStatsLoad();

      // Check cache first
      const cachedPropertyStats = getCachedPropertyStats();
      const cachedDocumentStats = getCachedDocumentStats();

      if (cachedPropertyStats && cachedDocumentStats) {
        // Use cached data immediately with proper data mapping
        const cachedStats = {
          totalProperties: cachedPropertyStats?.totalProperties || cachedPropertyStats?.total || 0,
          pendingProperties: cachedPropertyStats?.pendingProperties || cachedPropertyStats?.pending || 0,
          approvedProperties: cachedPropertyStats?.approvedProperties || cachedPropertyStats?.approved || 0,
          rejectedProperties: cachedPropertyStats?.rejectedProperties || cachedPropertyStats?.rejected || 0,
          totalDocuments: cachedDocumentStats?.totalDocuments || cachedDocumentStats?.total || 0,
          pendingDocuments: cachedDocumentStats?.pendingVerification || cachedDocumentStats?.pending || 0,
          verifiedDocuments: cachedDocumentStats?.verifiedDocuments || cachedDocumentStats?.verified || 0,
          rejectedDocuments: cachedDocumentStats?.rejectedDocuments || cachedDocumentStats?.rejected || 0
        };

        setStats(cachedStats);
        setStatsLoading(false);
        finishStatsLoad();
        return;
      }

      // Load fresh data
      const [propertyStats, documentStats] = await Promise.all([
        getPropertyStats().catch(error => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Property stats failed:', error);
          }
          return { totalProperties: 0, pendingProperties: 0, approvedProperties: 0, rejectedProperties: 0 };
        }),
        getDocumentStats().catch(error => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Document stats failed:', error);
          }
          return { totalDocuments: 0, pendingVerification: 0, verifiedDocuments: 0, rejectedDocuments: 0 };
        })
      ]);

      // Cache the results
      cachePropertyStats(propertyStats);
      cacheDocumentStats(documentStats);

      // Update state immediately with proper data mapping
      const newStats = {
        totalProperties: propertyStats?.totalProperties || propertyStats?.total || 0,
        pendingProperties: propertyStats?.pendingProperties || propertyStats?.pending || 0,
        approvedProperties: propertyStats?.approvedProperties || propertyStats?.approved || 0,
        rejectedProperties: propertyStats?.rejectedProperties || propertyStats?.rejected || 0,
        totalDocuments: documentStats?.totalDocuments || documentStats?.total || 0,
        pendingDocuments: documentStats?.pendingVerification || documentStats?.pending || 0,
        verifiedDocuments: documentStats?.verifiedDocuments || documentStats?.verified || 0,
        rejectedDocuments: documentStats?.rejectedDocuments || documentStats?.rejected || 0
      };

      setStats(newStats);

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading stats:', error);
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
  }, [statsLoading]);

  // Load pending applications independently with simplified error handling
  const loadPendingApplications = useCallback(async () => {
    // Prevent duplicate calls
    if (!pendingAppsLoading) {
      setPendingAppsLoading(true);
      setPendingAppsError(null);
    } else {
      return; // Already loading, skip
    }

    try {
      trackPendingAppsLoad();

      // Check cache first
      const cachedData = getCachedPendingProperties();
      if (cachedData) {
        setPendingApplications(cachedData);
        setPendingAppsLoading(false);
        finishPendingAppsLoad();
        return;
      }

      // Load fresh data
      const pendingAppsResponse = await getPendingProperties({ limit: 10 })
        .catch(error => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error loading pending applications:', error);
          }
          setPendingAppsError(error);
          return [];
        });

      // Handle response format
      const applications = pendingAppsResponse?.properties || pendingAppsResponse || [];

      // Cache and update state immediately
      cachePendingProperties(applications);
      setPendingApplications(applications);

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading pending applications:', error);
      }
      setPendingAppsError(error);
      setPendingApplications([]);
    } finally {
      setPendingAppsLoading(false);
      finishPendingAppsLoad();
    }
  }, [pendingAppsLoading]);







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
            <p className="text-gray-600">Manage property applications and registrations</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link
              to="/landofficer/property-verification"
              className="btn-primary px-4 py-2 rounded-md flex items-center"
            >
              <DocumentTextIcon className="h-5 w-5 mr-1" />
              View Pending Applications
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Search */}
      <div className="mb-8">
        <DashboardSearch
          placeholder="Search applications, properties..."
          searchType="landOfficer"
          className="w-full"
        />
      </div>

      {/* Loading Progress Indicator - Only show if actually loading */}
      {(statsLoading || pendingAppsLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <div className="text-sm text-blue-800">
              Loading dashboard data...
              {statsLoading && <span className="ml-2">📊 Statistics</span>}
              {pendingAppsLoading && <span className="ml-2">🏠 Applications</span>}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-2">
            <DocumentTextIcon className="h-6 w-6 text-primary mr-2" />
            <h3 className="text-lg font-semibold">Pending Applications</h3>
          </div>
          <div className="text-3xl font-bold text-primary">
            {statsLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              stats.pendingProperties || 0
            )}
          </div>
          <p className="text-gray-600 mt-1">Awaiting review</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-2">
            <ClockIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Under Review</h3>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {pendingAppsLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              pendingApplications.filter(app => app.status === 'under_review').length || 0
            )}
          </div>
          <p className="text-gray-600 mt-1">Applications in progress</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-2">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold">Approved</h3>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {statsLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              stats.approvedProperties || 0
            )}
          </div>
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
              to="/landofficer/property-verification"
              className="block w-full p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-center"
            >
              <DocumentTextIcon className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm">Verify Properties</span>
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
              Review submitted property information and registration details.
            </p>
            <Link to="/landofficer/property-verification" className="mt-3 inline-block text-primary hover:underline text-sm">
              Access Verification Tools
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




    </div>
  );
};

export default LandOfficerDashboard;

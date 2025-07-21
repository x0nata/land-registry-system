import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ClockIcon,
  FunnelIcon,
  EyeIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  HomeIcon,
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getRecentActivities, getUserRecentActivities } from '../../services/applicationLogService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { debounce } from '../../utils/debounce';

const RecentActivity = ({
  limit = 10,
  showFilters = true,
  showHeader = true,
  className = '',
  userSpecific = false,
  dashboard = false
}) => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filters, setFilters] = useState({
    type: 'all',
    timeRange: '7d',
    status: 'all'
  });
  const [showAllFilters, setShowAllFilters] = useState(false);

  const { user } = useAuth();

  // Memoize the filter function for better performance (moved up to avoid hoisting issues)
  const applyFilters = useCallback(() => {
    let filtered = [...activities];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(activity => activity.action === filters.type);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(activity => activity.status === filters.status);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(activity => new Date(activity.timestamp) >= filterDate);
    }

    setFilteredActivities(filtered.slice(0, limit));
  }, [activities, filters, limit]);

  // Create a debounced version of applyFilters for better performance
  const debouncedApplyFilters = useMemo(
    () => debounce(applyFilters, 300),
    [applyFilters]
  );

  useEffect(() => {
    loadActivities();
  }, [limit]);

  useEffect(() => {
    // Use immediate filter application for initial load
    if (activities.length > 0) {
      applyFilters();
    }
  }, [activities, applyFilters]);

  useEffect(() => {
    // Use debounced filter application for filter changes
    if (activities.length > 0) {
      debouncedApplyFilters();
    }
  }, [filters, debouncedApplyFilters, activities.length]);

  const loadActivities = async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setIsLoading(true);
        setError(null);
        setRetryCount(0);
      }

      // Optimize: Only fetch what we need, don't over-fetch
      const fetchLimit = Math.min(limit + 5, 20); // Small buffer for filtering, but cap at 20
      const response = userSpecific
        ? await getUserRecentActivities({ limit: fetchLimit, dashboard })
        : await getRecentActivities({ limit: fetchLimit, dashboard });

      setActivities(response || []);
      setError(null);

      if (isRetry) {
        toast.success('Recent activities loaded successfully');
      }
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setError(error);

      if (error.isTimeout) {
        // Don't show toast for timeout errors, we'll show a retry button instead
        console.log('Request timed out, showing retry option');
      } else {
        toast.error(error.message || 'Failed to load recent activities');
      }

      setActivities([]);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  // Manual retry function
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await loadActivities(true);
  };

  // Removed duplicate applyFilters and debouncedApplyFilters functions (moved up to avoid hoisting issues)

  const getActivityIcon = (action, status) => {
    const iconClass = "h-5 w-5";

    switch (action) {
      case 'application_submitted':
        return <DocumentTextIcon className={`${iconClass} text-yellow-600`} />;
      case 'application_approved':
        return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
      case 'application_rejected':
        return <XCircleIcon className={`${iconClass} text-red-600`} />;
      case 'payment_made':
        return <CurrencyDollarIcon className={`${iconClass} text-green-600`} />;
      case 'document_uploaded':
        return <DocumentTextIcon className={`${iconClass} text-blue-600`} />;
      case 'user_registered':
        return <UserIcon className={`${iconClass} text-purple-600`} />;
      case 'status_changed':
        return status === 'approved' ?
          <CheckCircleIcon className={`${iconClass} text-green-600`} /> :
          <ExclamationTriangleIcon className={`${iconClass} text-yellow-600`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-600`} />;
    }
  };

  const getActivityColor = (action, status) => {
    switch (action) {
      case 'application_submitted':
        return 'bg-yellow-50 border-yellow-200';
      case 'application_approved':
        return 'bg-green-50 border-green-200';
      case 'application_rejected':
        return 'bg-red-50 border-red-200';
      case 'payment_made':
        return 'bg-green-50 border-green-200';
      case 'document_uploaded':
        return 'bg-blue-50 border-blue-200';
      case 'user_registered':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatActivityTitle = (activity) => {
    const actionTitles = {
      application_submitted: 'Application Submitted',
      application_approved: 'Application Approved',
      application_rejected: 'Application Rejected',
      payment_made: 'Payment Made',
      document_uploaded: 'Document Uploaded',
      user_registered: 'User Registered',
      status_changed: 'Status Changed'
    };

    return actionTitles[activity.action] || activity.action.replace('_', ' ').toUpperCase();
  };

  const formatActivityDescription = (activity) => {
    const property = activity.property;
    const user = activity.user || activity.performedBy;

    switch (activity.action) {
      case 'application_submitted':
        return `Application for ${property?.plotNumber || 'property'} submitted by ${user?.fullName || 'Unknown'}`;
      case 'application_approved':
        return `Application for ${property?.plotNumber || 'property'} approved`;
      case 'application_rejected':
        return `Application for ${property?.plotNumber || 'property'} rejected`;
      case 'payment_made':
        return `Payment made for ${property?.plotNumber || 'property'} by ${user?.fullName || 'Unknown'}`;
      case 'document_uploaded':
        return `Document uploaded for ${property?.plotNumber || 'property'}`;
      case 'user_registered':
        return `New user ${user?.fullName || 'Unknown'} registered`;
      case 'status_changed':
        return `Status changed to ${activity.status} for ${property?.plotNumber || 'property'}`;
      default:
        return activity.description || 'Activity performed';
    }
  };

  const getActivityLink = (activity) => {
    if (activity.property?._id || activity.property?.id) {
      return `/property/${activity.property._id || activity.property.id}`;
    }
    if ((activity.user?._id || activity.user?.id) && user?.role === 'admin') {
      return `/admin/users/${activity.user._id || activity.user.id}`;
    }
    return null;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return activityTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: activityTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        {showHeader && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
        )}
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-start space-x-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
              Recent Activity
            </h3>
            {showFilters && (
              <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && showAllFilters && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full form-input text-sm"
              >
                <option value="all">All Types</option>
                <option value="application_submitted">Application Submitted</option>
                <option value="application_approved">Application Approved</option>
                <option value="application_rejected">Application Rejected</option>
                <option value="payment_made">Payment Made</option>
                <option value="document_uploaded">Document Uploaded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
                className="w-full form-input text-sm"
              >
                <option value="all">All Time</option>
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full form-input text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error && error.isTimeout ? (
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Request Timed Out</h3>
            <p className="text-gray-500 mb-4">
              The server is taking longer than expected to respond. This might be due to high server load.
            </p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Retrying...
                </>
              ) : (
                <>
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Try Again {retryCount > 0 && `(${retryCount})`}
                </>
              )}
            </button>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load</h3>
            <p className="text-gray-500 mb-4">{error.message || 'An error occurred while loading recent activities.'}</p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Retrying...
                </>
              ) : (
                'Try Again'
              )}
            </button>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
              const activityLink = getActivityLink(activity);

              const ActivityContent = () => (
                <div className={`p-4 rounded-lg border ${getActivityColor(activity.action, activity.status)} hover:shadow-sm transition-shadow`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.action, activity.status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {formatActivityTitle(activity)}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatActivityDescription(activity)}
                          </p>

                          {activity.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              "{activity.notes}"
                            </p>
                          )}
                        </div>

                        <div className="flex-shrink-0 ml-4 text-right">
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                          {activityLink && (
                            <div className="mt-1">
                              <EyeIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );

              return activityLink ? (
                <Link key={activity.id || index} to={activityLink}>
                  <ActivityContent />
                </Link>
              ) : (
                <div key={activity.id || index}>
                  <ActivityContent />
                </div>
              );
            })}
          </div>
        )}

        {/* View All Link */}
        {filteredActivities.length > 0 && activities.length > limit && (
          <div className="mt-6 text-center">
            <Link
              to="/dashboard/activity"
              className="inline-flex items-center text-sm text-primary hover:text-primary-dark"
            >
              View all activity
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(RecentActivity);

import { useState, useEffect, useCallback, useRef } from 'react';
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

const RecentActivity = ({
  limit = 10,
  showFilters = true,
  showHeader = true,
  className = '',
  userSpecific = false
}) => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    timeRange: '7d',
    status: 'all'
  });
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [hasShownError, setHasShownError] = useState(false);

  const { user } = useAuth();
  const loadingRef = useRef(false);

  const loadActivities = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log('Already loading activities, skipping...');
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setHasShownError(false);

      console.log(`Loading activities - userSpecific: ${userSpecific}, limit: ${limit}`);

      const response = userSpecific
        ? await getUserRecentActivities({ limit: limit * 2 })
        : await getRecentActivities({ limit: limit * 2 }); // Get more to allow for filtering

      console.log(`Loaded ${response?.length || 0} activities`);
      setActivities(response || []);
    } catch (error) {
      console.error('Error loading recent activities:', error);

      // Only show error toast once per component instance
      if (!hasShownError) {
        toast.error('Failed to load recent activities');
        setHasShownError(true);
      }

      setActivities([]);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [limit, userSpecific, hasShownError]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    applyFilters();
  }, [activities, filters]);

  const applyFilters = () => {
    let filtered = [...activities];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(activity => activity.action === filters.type);
    }

    // Filter by time range
    const now = new Date();
    const timeRanges = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    if (filters.timeRange !== 'all' && timeRanges[filters.timeRange]) {
      const cutoffDate = new Date(now.getTime() - (timeRanges[filters.timeRange] * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(activity => new Date(activity.timestamp) >= cutoffDate);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(activity => activity.status === filters.status);
    }

    setFilteredActivities(filtered.slice(0, limit));
  };

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
        {filteredActivities.length === 0 ? (
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

export default RecentActivity;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClockIcon,
  DocumentTextIcon,
  HomeIcon,
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { getRecentActivities, getUserRecentActivities } from '../../services/applicationLogService';
import { useAuth } from '../../context/AuthContext';

const ActivityTimeline = ({
  propertyId = null,
  userId = null,
  limit = 20,
  className = '',
  userSpecific = false
}) => {
  const [activities, setActivities] = useState([]);
  const [groupedActivities, setGroupedActivities] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    loadActivities();
  }, [propertyId, userId, limit]);

  useEffect(() => {
    groupActivitiesByDate();
  }, [activities]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const params = { limit };

      if (propertyId) {
        params.propertyId = propertyId;
      }
      if (userId) {
        params.userId = userId;
      }

      const response = userSpecific
        ? await getUserRecentActivities(params)
        : await getRecentActivities(params);
      setActivities(response || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const groupActivitiesByDate = () => {
    const grouped = activities.reduce((acc, activity) => {
      const date = new Date(activity.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});

    setGroupedActivities(grouped);
  };

  const getActivityIcon = (action, status) => {
    const iconClass = "h-4 w-4";

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

  const getActivityColor = (action) => {
    switch (action) {
      case 'application_submitted':
        return 'border-yellow-500 bg-yellow-50';
      case 'application_approved':
        return 'border-green-500 bg-green-50';
      case 'application_rejected':
        return 'border-red-500 bg-red-50';
      case 'payment_made':
        return 'border-green-500 bg-green-50';
      case 'document_uploaded':
        return 'border-blue-500 bg-blue-50';
      case 'user_registered':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-500 bg-gray-50';
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
    const activityUser = activity.user || activity.performedBy;

    switch (activity.action) {
      case 'application_submitted':
        return `Application submitted for property ${property?.plotNumber || 'N/A'}`;
      case 'application_approved':
        return `Application approved for property ${property?.plotNumber || 'N/A'}`;
      case 'application_rejected':
        return `Application rejected for property ${property?.plotNumber || 'N/A'}`;
      case 'payment_made':
        return `Payment processed for property ${property?.plotNumber || 'N/A'}`;
      case 'document_uploaded':
        return `Document uploaded for property ${property?.plotNumber || 'N/A'}`;
      case 'user_registered':
        return `User ${activityUser?.fullName || 'Unknown'} registered`;
      case 'status_changed':
        return `Status changed to ${activity.status}`;
      default:
        return activity.description || 'Activity performed';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getActivityLink = (activity) => {
    if (activity.property?.id) {
      return `/property/${activity.property.id}`;
    }
    if (activity.user?.id && user?.role === 'admin') {
      return `/admin/users/${activity.user.id}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          {[...Array(3)].map((_, dateIndex) => (
            <div key={dateIndex}>
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-4">
                {[...Array(2)].map((_, activityIndex) => (
                  <div key={activityIndex} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Object.keys(groupedActivities).length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
          <p className="text-gray-500">
            {propertyId ? 'No activity recorded for this property yet.' :
             userId ? 'No activity recorded for this user yet.' :
             'No recent activity to display.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
          Activity Timeline
        </h3>

        <div className="space-y-8">
          {Object.entries(groupedActivities)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, dateActivities]) => (
            <div key={date} className="relative">
              {/* Date Header */}
              <div className="sticky top-0 z-10 bg-white pb-2">
                <h4 className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded-lg inline-block">
                  {formatDate(date)}
                </h4>
              </div>

              {/* Activities for this date */}
              <div className="mt-4 space-y-4">
                {dateActivities.map((activity, index) => {
                  const activityLink = getActivityLink(activity);
                  const isLast = index === dateActivities.length - 1;

                  const ActivityContent = () => (
                    <div className="relative flex items-start space-x-4 group">
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200 -ml-px"></div>
                      )}

                      {/* Activity icon */}
                      <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${getActivityColor(activity.action)} group-hover:scale-110 transition-transform`}>
                        {getActivityIcon(activity.action, activity.status)}
                      </div>

                      {/* Activity content */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                              {formatActivityTitle(activity)}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatActivityDescription(activity)}
                            </p>

                            {activity.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 p-2 rounded">
                                "{activity.notes}"
                              </p>
                            )}

                            {/* Additional metadata */}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{formatTime(activity.timestamp)}</span>

                              {activity.performedBy && (
                                <span>
                                  by {activity.performedBy.fullName}
                                </span>
                              )}

                              {activity.status && (
                                <span className={`px-2 py-1 rounded-full ${
                                  activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {activity.status}
                                </span>
                              )}
                            </div>
                          </div>

                          {activityLink && (
                            <div className="flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs text-primary">View →</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );

                  return activityLink ? (
                    <Link key={activity.id || `${date}-${index}`} to={activityLink}>
                      <ActivityContent />
                    </Link>
                  ) : (
                    <div key={activity.id || `${date}-${index}`}>
                      <ActivityContent />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Load more button */}
        {activities.length >= limit && (
          <div className="mt-8 text-center">
            <button
              onClick={() => loadActivities()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Load More Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;

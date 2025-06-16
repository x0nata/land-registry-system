import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  BellIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const Notifications = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 7) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application':
        return <DocumentTextIcon className="h-6 w-6 text-blue-500" />;
      case 'payment':
        return <CurrencyDollarIcon className="h-6 w-6 text-green-500" />;
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  // Update document title
  useEffect(() => {
    document.title = 'Notifications | Property Registration System';
    return () => {
      document.title = 'Property Registration System';
    };
  }, []);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: '/notifications' } } });
      return;
    }
    setLoading(false);
  }, [isAuthenticated, navigate]);

  // Handle mark all as read with toast
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast.success('All notifications marked as read');
  };

  // Handle delete notification with toast
  const handleDeleteNotification = (notificationId) => {
    deleteNotification(notificationId);
    toast.success('Notification deleted');
  };

  // Handle clear all notifications with toast
  const handleClearAllNotifications = () => {
    clearAllNotifications();
    toast.success('All notifications cleared');
  };

  // Filter notifications
  const filteredNotifications = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter(notification => !notification.read)
      : notifications.filter(notification => notification.type === filter);

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="ml-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${
                unreadCount === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Mark All as Read
            </button>

            <button
              onClick={handleClearAllNotifications}
              disabled={notifications.length === 0}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${
                notifications.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-accent text-white hover:bg-accent-dark'
              }`}
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Clear All
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'unread'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('application')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'application'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setFilter('payment')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'payment'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'warning'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Warnings
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BellIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p>No notifications found</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <span className="text-sm text-gray-500">{formatDate(notification.date)}</span>
                    </div>
                    <p className="text-gray-700 mt-1">{notification.message}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <div>
                        {notification.link && (
                          <Link to={notification.link} className="text-primary hover:underline text-sm">
                            View Details
                          </Link>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-gray-600 hover:text-primary flex items-center"
                          >
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-sm text-gray-600 hover:text-red-600 flex items-center"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { getLandOfficerReports } from '../../services/propertyService';
import { useAuth } from '../../context/AuthContext';

const Reports = () => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getLandOfficerReports();
      setReportsData(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'document_verified':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'document_rejected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'property_approved':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
      case 'property_rejected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'document_verified':
      case 'property_approved':
        return 'text-green-800 bg-green-100';
      case 'document_rejected':
      case 'property_rejected':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Reports & Statistics</h1>
            <p className="text-gray-600">View your personal activity and performance metrics</p>
            {user && (
              <p className="text-sm text-blue-600 mt-1">Land Officer: {user.fullName}</p>
            )}
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Documents Verified</p>
                <p className="text-2xl font-bold text-blue-900">
                  {reportsData?.documentsVerified || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Properties Approved</p>
                <p className="text-2xl font-bold text-green-900">
                  {reportsData?.propertiesApproved || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Properties Rejected</p>
                <p className="text-2xl font-bold text-red-900">
                  {reportsData?.propertiesRejected || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Payments Verified</p>
                <p className="text-2xl font-bold text-purple-900">
                  {reportsData?.paymentsVerified || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Activities:</span>
                <span className="font-medium">{reportsData?.totalActivities || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documents Verified:</span>
                <span className="font-medium text-green-600">{reportsData?.documentsVerified || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Properties Approved:</span>
                <span className="font-medium text-blue-600">{reportsData?.propertiesApproved || 0}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Properties Rejected:</span>
                <span className="font-medium text-red-600">{reportsData?.propertiesRejected || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payments Verified:</span>
                <span className="font-medium text-purple-600">{reportsData?.paymentsVerified || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate:</span>
                <span className="font-medium text-green-600">
                  {reportsData?.propertiesApproved && reportsData?.totalActivities
                    ? `${Math.round((reportsData.propertiesApproved / (reportsData.propertiesApproved + reportsData.propertiesRejected)) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          {reportsData?.recentActivities && reportsData.recentActivities.length > 0 ? (
            <div className="space-y-4">
              {reportsData.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getActivityIcon(activity.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        Plot: {activity.plotNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {formatDate(activity.date)}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActivityColor(activity.type)}`}>
                      {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activities found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

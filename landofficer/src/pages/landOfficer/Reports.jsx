import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PresentationChartBarIcon,
  MapPinIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const summaryData = {
    totalProperties: 1250,
    pendingApplications: 45,
    approvedApplications: 1180,
    rejectedApplications: 25,
    totalDocuments: 3750,
    verifiedDocuments: 3200,
    pendingDocuments: 480,
    rejectedDocuments: 70,
    totalUsers: 890,
    activeUsers: 750,
    landOfficers: 12,
    recentActivity: [
      { date: '2023-12-01', action: 'Property Approved', count: 15 },
      { date: '2023-12-02', action: 'Documents Verified', count: 28 },
      { date: '2023-12-03', action: 'New Applications', count: 12 },
      { date: '2023-12-04', action: 'Property Approved', count: 18 },
      { date: '2023-12-05', action: 'Documents Verified', count: 22 }
    ]
  };

  const handleDownloadReport = (reportType) => {
    toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report download initiated`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-gray-600">View system statistics and generate reports</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => handleDownloadReport('summary')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
              Download Report
            </button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <HomeIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Properties</p>
                <p className="text-2xl font-bold text-blue-900">{summaryData.totalProperties}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Approved</p>
                <p className="text-2xl font-bold text-green-900">{summaryData.approvedApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{summaryData.pendingApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <PresentationChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Users</p>
                <p className="text-2xl font-bold text-purple-900">{summaryData.totalUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Document Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Documents:</span>
                <span className="font-medium">{summaryData.totalDocuments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Verified:</span>
                <span className="font-medium text-green-600">{summaryData.verifiedDocuments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-medium text-yellow-600">{summaryData.pendingDocuments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rejected:</span>
                <span className="font-medium text-red-600">{summaryData.rejectedDocuments}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">User Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Users:</span>
                <span className="font-medium">{summaryData.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users:</span>
                <span className="font-medium text-green-600">{summaryData.activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Land Officers:</span>
                <span className="font-medium text-blue-600">{summaryData.landOfficers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaryData.recentActivity.map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

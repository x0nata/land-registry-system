// Static dashboard with no API calls to prevent looping
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const StaticDashboard = () => {
  const { user, loading } = useAuth();

  // Static data to prevent API timeouts
  const stats = {
    pendingProperties: 12,
    approvedProperties: 28,
    rejectedProperties: 5,
    totalDocuments: 150
  };

  const pendingApplications = [
    {
      _id: 'demo1',
      owner: { fullName: 'John Doe' },
      plotNumber: 'PLT-001',
      location: { subCity: 'Addis Ketema', kebele: '05' },
      propertyType: 'residential',
      status: 'pending',
      registrationDate: new Date().toISOString()
    },
    {
      _id: 'demo2',
      owner: { fullName: 'Jane Smith' },
      plotNumber: 'PLT-002',
      location: { subCity: 'Bole', kebele: '03' },
      propertyType: 'commercial',
      status: 'under_review',
      registrationDate: new Date(Date.now() - 86400000).toISOString()
    }
  ];

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Land Officer Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.fullName || 'Land Officer'}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pending Applications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-6 w-6 text-primary mr-2" />
              <h3 className="text-lg font-semibold">Pending</h3>
            </div>
            <div className="text-3xl font-bold text-primary">
              {stats.pendingProperties}
            </div>
            <p className="text-gray-600 mt-1">Applications</p>
          </div>

          {/* Under Review */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Under Review</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {pendingApplications.filter(app => app.status === 'under_review').length}
            </div>
            <p className="text-gray-600 mt-1">In Progress</p>
          </div>

          {/* Approved */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-2">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold">Approved</h3>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {stats.approvedProperties}
            </div>
            <p className="text-gray-600 mt-1">Properties</p>
          </div>

          {/* Total Documents */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-2">
              <ChartBarIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold">Documents</h3>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {stats.totalDocuments}
            </div>
            <p className="text-gray-600 mt-1">Total</p>
          </div>
        </div>

        {/* Pending Applications Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Recent Pending Applications</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plot Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingApplications.map((application) => (
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
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-right">
            <Link to="/landofficer/property-verification" className="text-primary hover:underline">
              View All Pending Applications
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/landofficer/property-verification"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <DocumentTextIcon className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Property Verification</h3>
            <p className="text-gray-600">Review and verify property applications</p>
          </Link>

          <Link
            to="/landofficer/document-verification"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <CheckCircleIcon className="h-8 w-8 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Document Verification</h3>
            <p className="text-gray-600">Verify submitted documents</p>
          </Link>

          <Link
            to="/landofficer/reports"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <ChartBarIcon className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Reports</h3>
            <p className="text-gray-600">View detailed reports and analytics</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaticDashboard;

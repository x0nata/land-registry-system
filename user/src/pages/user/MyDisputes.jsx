import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  EyeIcon, 
  PlusIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { getUserDisputes, withdrawDispute } from '../../services/disputeService';

const MyDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch disputes
  const fetchDisputes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getUserDisputes(page, 10);
      setDisputes(response.disputes || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes(currentPage);
  }, [currentPage]);

  // Handle withdraw dispute
  const handleWithdraw = async (disputeId) => {
    if (!window.confirm('Are you sure you want to withdraw this dispute? This action cannot be undone.')) {
      return;
    }

    const reason = prompt('Please provide a reason for withdrawing this dispute:');
    if (!reason) return;

    try {
      await withdrawDispute(disputeId, reason);
      toast.success('Dispute withdrawn successfully');
      fetchDisputes(currentPage); // Refresh the list
    } catch (error) {
      console.error('Error withdrawing dispute:', error);
      toast.error(error.message || 'Failed to withdraw dispute');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, text: 'Submitted' },
      under_review: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Under Review' },
      investigation: { color: 'bg-orange-100 text-orange-800', icon: ExclamationTriangleIcon, text: 'Investigation' },
      mediation: { color: 'bg-purple-100 text-purple-800', icon: ClockIcon, text: 'Mediation' },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Resolved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: 'Rejected' },
      withdrawn: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon, text: 'Withdrawn' }
    };

    const config = statusConfig[status] || statusConfig.submitted;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priorityConfig[priority] || priorityConfig.medium}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Disputes</h1>
          <Link
            to="/disputes/submit"
            className="btn-primary px-4 py-2 rounded-md flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Submit New Dispute
          </Link>
        </div>

        {disputes.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No disputes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't submitted any disputes yet.
            </p>
            <div className="mt-6">
              <Link
                to="/disputes/submit"
                className="btn-primary px-4 py-2 rounded-md"
              >
                Submit Your First Dispute
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispute
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {disputes.map((dispute) => (
                    <tr key={dispute._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {dispute.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {dispute.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Plot {dispute.property?.plotNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dispute.property?.location?.subCity}, {dispute.property?.location?.kebele}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {dispute.disputeType.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(dispute.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(dispute.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(dispute.submissionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/disputes/${dispute._id}`}
                            className="text-primary hover:text-primary-dark flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Link>
                          {['submitted', 'under_review', 'investigation'].includes(dispute.status) && (
                            <button
                              onClick={() => handleWithdraw(dispute._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages} 
                  ({pagination.totalDisputes} total disputes)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyDisputes;

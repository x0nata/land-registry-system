import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ExclamationTriangleIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserIcon,
  HomeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import {
  getAllDisputes,
  updateDisputeStatus,
  resolveDispute,
  assignDispute,
  formatDisputeStatus,
  formatDisputeType,
  getDisputeStatusColor,
  getDisputePriority,
  getPriorityColor
} from '../../services/disputeService';
import { getAllUsers } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const AdminDisputes = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [landOfficers, setLandOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to format location object
  const formatLocation = (location) => {
    if (!location || typeof location !== 'object') return 'N/A';

    const parts = [];
    if (location.kebele) parts.push(location.kebele);
    if (location.subCity) parts.push(location.subCity);

    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  const [resolution, setResolution] = useState({ decision: '', resolutionNotes: '', actionRequired: '' });
  const [assignment, setAssignment] = useState({ assignedTo: '', notes: '' });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch disputes
      await fetchDisputes();

      // Only fetch land officers once for admin users
      if (user?.role === 'admin' && landOfficers.length === 0) {
        await fetchLandOfficers();
      }
    };

    fetchData();
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await getAllDisputes({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        disputeType: typeFilter,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setDisputes(response.disputes || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching disputes:', error);

      // Provide more user-friendly error messages
      if (error.message?.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else if (error.message?.includes('Network Error')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.message || 'Failed to fetch disputes');
      }

      // Set empty data on error to prevent UI issues
      setDisputes([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const fetchLandOfficers = async () => {
    try {
      console.log('Fetching land officers...');
      const response = await getAllUsers({ role: 'landOfficer', limit: 100 });
      console.log('Land officers response:', response);
      setLandOfficers(response.users || []);
    } catch (error) {
      console.error('Error fetching land officers:', error);

      // Don't show error toast for land officers as it's not critical
      // Just log the error and continue
      setLandOfficers([]);
    }
  };

  const handleStatusUpdate = async () => {
    console.log('handleStatusUpdate called', { selectedDispute: selectedDispute?._id, statusUpdate });

    if (!statusUpdate.status || !statusUpdate.notes.trim()) {
      toast.error('Status and notes are required');
      return;
    }

    try {
      console.log('Calling updateDisputeStatus API...');
      const result = await updateDisputeStatus(selectedDispute._id, statusUpdate);
      console.log('Status update result:', result);

      toast.success('Dispute status updated successfully');
      setShowStatusModal(false);
      setSelectedDispute(null);
      setStatusUpdate({ status: '', notes: '' });
      fetchDisputes();
    } catch (error) {
      console.error('Error updating dispute status:', error);
      toast.error(error.message || 'Failed to update dispute status');
    }
  };

  const handleResolveDispute = async () => {
    console.log('handleResolveDispute called', { selectedDispute: selectedDispute?._id, resolution });

    if (!resolution.decision || !resolution.resolutionNotes.trim()) {
      toast.error('Decision and resolution notes are required');
      return;
    }

    try {
      console.log('Calling resolveDispute API...');
      const result = await resolveDispute(selectedDispute._id, resolution);
      console.log('Resolve result:', result);

      toast.success('Dispute resolved successfully');
      setShowResolveModal(false);
      setSelectedDispute(null);
      setResolution({ decision: '', resolutionNotes: '', actionRequired: '' });
      fetchDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error(error.message || 'Failed to resolve dispute');
    }
  };

  const handleAssignDispute = async () => {
    console.log('handleAssignDispute called', { selectedDispute: selectedDispute?._id, assignment });

    if (!assignment.assignedTo) {
      toast.error('Please select a land officer to assign');
      return;
    }

    try {
      console.log('Calling assignDispute API...');
      const result = await assignDispute(selectedDispute._id, assignment);
      console.log('Assign result:', result);

      toast.success('Dispute assigned successfully');
      setShowAssignModal(false);
      setSelectedDispute(null);
      setAssignment({ assignedTo: '', notes: '' });
      fetchDisputes();
    } catch (error) {
      console.error('Error assigning dispute:', error);
      toast.error(error.message || 'Failed to assign dispute');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDisputes();
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'dismissed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'withdrawn':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 mr-2 text-yellow-600" />
            Dispute Management
          </h1>
          <button
            onClick={fetchDisputes}
            disabled={loading}
            className="mt-4 md:mt-0 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-1" />
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search disputes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="investigation">Investigation</option>
            <option value="mediation">Mediation</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          <select
            value={typeFilter}
            onChange={handleTypeFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="ownership_dispute">Ownership Dispute</option>
            <option value="boundary_dispute">Boundary Dispute</option>
            <option value="documentation_error">Documentation Error</option>
            <option value="fraudulent_registration">Fraudulent Registration</option>
            <option value="inheritance_dispute">Inheritance Dispute</option>
            <option value="other">Other</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {disputes.length} of {pagination.totalItems || 0} disputes
          </div>
        </div>

        {/* Disputes Table */}
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
                  Disputant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {disputes.map((dispute) => {
                const priority = getDisputePriority(dispute);
                return (
                  <tr key={dispute._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(dispute.status)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {dispute.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDisputeType(dispute.disputeType)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <HomeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {dispute.property?.plotNumber || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatLocation(dispute.property?.location)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {dispute.disputant?.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {dispute.disputant?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDisputeStatusColor(dispute.status)}`}>
                        {formatDisputeStatus(dispute.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getPriorityColor(priority)}`}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/admin/disputes/${dispute._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        {dispute.status !== 'resolved' && dispute.status !== 'dismissed' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setShowStatusModal(true);
                              }}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <DocumentTextIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setShowResolveModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setShowAssignModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                <UserIcon className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {disputes.length === 0 && (
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No disputes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search criteria.'
                : 'No disputes have been submitted yet.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedDispute && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update Dispute Status
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="under_review">Under Review</option>
                  <option value="investigation">Investigation</option>
                  <option value="mediation">Mediation</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notes about the status update..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedDispute(null);
                    setStatusUpdate({ status: '', notes: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Resolve Dispute
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision
                </label>
                <select
                  value={resolution.decision}
                  onChange={(e) => setResolution({ ...resolution, decision: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select decision</option>
                  <option value="in_favor_of_disputant">In Favor of Disputant</option>
                  <option value="in_favor_of_respondent">In Favor of Respondent</option>
                  <option value="compromise">Compromise</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={resolution.resolutionNotes}
                  onChange={(e) => setResolution({ ...resolution, resolutionNotes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter detailed resolution notes..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Required (Optional)
                </label>
                <textarea
                  value={resolution.actionRequired}
                  onChange={(e) => setResolution({ ...resolution, actionRequired: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any follow-up actions required..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedDispute(null);
                    setResolution({ decision: '', resolutionNotes: '', actionRequired: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveDispute}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Resolve Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Dispute Modal */}
      {showAssignModal && selectedDispute && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Dispute
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Land Officer
                </label>
                <select
                  value={assignment.assignedTo}
                  onChange={(e) => setAssignment({ ...assignment, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select land officer</option>
                  {landOfficers.map((officer) => (
                    <option key={officer._id} value={officer._id}>
                      {officer.fullName} ({officer.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={assignment.notes}
                  onChange={(e) => setAssignment({ ...assignment, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any specific instructions for the assigned officer..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedDispute(null);
                    setAssignment({ assignedTo: '', notes: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDispute}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  Assign Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;

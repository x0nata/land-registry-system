import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowPathIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { getAllTransfers, exportTransferData, searchTransfers } from '../../services/transferService';
import { useAuth } from '../../context/AuthContext';

const AdminTransferManagement = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState([]);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [transferTypeFilter, setTransferTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const transferStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'initiated', label: 'Initiated' },
    { value: 'documents_pending', label: 'Documents Pending' },
    { value: 'documents_submitted', label: 'Documents Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'compliance_check', label: 'Compliance Check' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const transferTypes = [
    { value: '', label: 'All Types' },
    { value: 'sale', label: 'Sale' },
    { value: 'inheritance', label: 'Inheritance' },
    { value: 'gift', label: 'Gift' },
    { value: 'court_order', label: 'Court Order' },
    { value: 'government_acquisition', label: 'Government Acquisition' },
    { value: 'exchange', label: 'Exchange' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchTransfers();
  }, [currentPage, statusFilter, transferTypeFilter, searchQuery]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 10
      };

      if (statusFilter) params.status = statusFilter;
      if (transferTypeFilter) params.transferType = transferTypeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await getAllTransfers(params);
      
      setTransfers(response.transfers || []);
      setPagination(response.pagination || {});
      
      // Calculate statistics
      const stats = calculateStatistics(response.transfers || []);
      setStatistics(stats);
      
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError(err.message || 'Failed to fetch transfers');
      toast.error(err.message || 'Failed to fetch transfers');
      setTransfers([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (transfersData) => {
    const total = transfersData.length;
    const pending = transfersData.filter(t => ['initiated', 'documents_pending', 'documents_submitted'].includes(t.status)).length;
    const underReview = transfersData.filter(t => ['under_review', 'compliance_check'].includes(t.status)).length;
    const approved = transfersData.filter(t => t.status === 'approved').length;
    const completed = transfersData.filter(t => t.status === 'completed').length;
    const rejected = transfersData.filter(t => t.status === 'rejected').length;

    return [
      { label: 'Total Transfers', value: total, color: 'bg-blue-500' },
      { label: 'Pending', value: pending, color: 'bg-yellow-500' },
      { label: 'Under Review', value: underReview, color: 'bg-orange-500' },
      { label: 'Approved', value: approved, color: 'bg-green-500' },
      { label: 'Completed', value: completed, color: 'bg-purple-500' },
      { label: 'Rejected', value: rejected, color: 'bg-red-500' }
    ];
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTransfers();
  };

  const handleExport = async () => {
    try {
      await exportTransferData({
        status: statusFilter,
        transferType: transferTypeFilter,
        search: searchQuery
      });
      toast.success('Transfer data exported successfully');
    } catch (err) {
      console.error('Error exporting data:', err);
      toast.error('Failed to export transfer data');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'initiated':
      case 'documents_pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'documents_submitted':
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'compliance_check':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTransferType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'ETB') => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Transfer Management</h1>
            <p className="text-gray-600">Monitor and oversee all property transfer requests</p>
            {user && (
              <p className="text-sm text-blue-600 mt-1">Admin: {user.fullName}</p>
            )}
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <button
              onClick={handleExport}
              className="btn-secondary px-4 py-2 rounded-md flex items-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
              Export Data
            </button>
            <button
              onClick={fetchTransfers}
              className="btn-primary px-4 py-2 rounded-md flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {statistics.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full ${stat.color} mr-3`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-semibold">Search & Filter Transfers</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-2 md:mt-0 flex items-center text-primary hover:text-primary-dark"
          >
            <FunnelIcon className="h-5 w-5 mr-1" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by plot number, owner name, or transfer ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input w-full"
              />
            </div>
            <button
              type="submit"
              className="btn-primary px-6 py-2 rounded-md flex items-center justify-center"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
              Search
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="form-label">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input w-full"
                >
                  {transferStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Transfer Type</label>
                <select
                  value={transferTypeFilter}
                  onChange={(e) => setTransferTypeFilter(e.target.value)}
                  className="form-input w-full"
                >
                  {transferTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Transfer Requests</h2>
        </div>

        {transfers.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transfers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter || transferTypeFilter
                ? 'Try adjusting your search criteria.'
                : 'No transfer requests have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transfer Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfers.map((transfer) => (
                  <tr key={transfer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Plot #{transfer.property?.plotNumber || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transfer.property?.location || 'Location not specified'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatTransferType(transfer.transferType)}
                        </div>
                        <div className="text-sm text-gray-500">
                          From: {transfer.previousOwner?.fullName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          To: {transfer.newOwner?.fullName || 'N/A'}
                        </div>
                        {transfer.transferValue?.amount > 0 && (
                          <div className="text-sm text-gray-500">
                            Value: {formatCurrency(transfer.transferValue.amount, transfer.transferValue.currency)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transfer.status)}`}>
                        {formatStatus(transfer.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transfer.initiationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/admin/transfers/${transfer._id}`}
                        className="text-primary hover:text-primary-dark flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{((currentPage - 1) * 10) + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, pagination.totalItems)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.totalItems}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-primary border-primary text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransferManagement;

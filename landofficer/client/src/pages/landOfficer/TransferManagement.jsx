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

const TransferManagement = () => {
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
    { value: 'pending', label: 'Pending Review' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' }
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
  }, [currentPage, statusFilter, transferTypeFilter]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const data = await getAllTransfers(currentPage, 10, statusFilter, transferTypeFilter);
      setTransfers(data.transfers || []);
      setPagination(data.pagination || {});
      setStatistics(data.statistics || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch transfers');
      toast.error(err.message || 'Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTransfers();
      return;
    }
    
    try {
      setLoading(true);
      const data = await searchTransfers(searchQuery, {
        status: statusFilter,
        transferType: transferTypeFilter
      });
      setTransfers(data.transfers || []);
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportTransferData({
        status: statusFilter,
        transferType: transferTypeFilter
      });
      toast.success('Transfer data exported successfully');
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'under_review':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'under_review':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'completed':
        return `${baseClasses} bg-green-200 text-green-900`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'ETB' ? 'USD' : currency,
      minimumFractionDigits: 0
    }).format(amount).replace('$', currency === 'ETB' ? 'ETB ' : '$');
  };

  if (loading && transfers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <p className="text-gray-600">Review and process property transfer requests</p>
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

      {/* Statistics */}
      {statistics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statistics.map((stat) => (
            <div key={stat._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                {getStatusIcon(stat._id)}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 capitalize">
                    {stat._id.replace('_', ' ')} Transfers
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search transfers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary px-4 py-2 rounded-md flex items-center"
            >
              <FunnelIcon className="h-5 w-5 mr-1" />
              Filters
            </button>
            <button
              onClick={handleSearch}
              className="btn-primary px-4 py-2 rounded-md"
            >
              Search
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                >
                  {transferStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Type
                </label>
                <select
                  value={transferTypeFilter}
                  onChange={(e) => setTransferTypeFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                >
                  {transferTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transfers List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {transfers.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transfers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter || transferTypeFilter
                ? 'Try adjusting your search criteria'
                : 'No transfer requests have been submitted yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property & Parties
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
                          <div className="text-xs text-gray-400 mt-1">
                            From: {transfer.previousOwner?.fullName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-400">
                            To: {transfer.newOwner?.fullName || 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatTransferType(transfer.transferType)}
                          </div>
                          {transfer.transferValue?.amount > 0 && (
                            <div className="text-sm text-gray-500">
                              {formatCurrency(transfer.transferValue.amount, transfer.transferValue.currency)}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {transfer.transferReason?.substring(0, 50)}
                            {transfer.transferReason?.length > 50 && '...'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(transfer.status)}
                          <span className={`ml-2 ${getStatusBadge(transfer.status)}`}>
                            {transfer.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transfer.initiationDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/landofficer/transfer-detail/${transfer._id}`}
                          className="text-primary hover:text-primary-dark flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span> ({pagination.totalTransfers} total transfers)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransferManagement;

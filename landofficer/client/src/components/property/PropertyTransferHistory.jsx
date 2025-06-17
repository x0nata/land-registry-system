import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getPropertyTransferHistory } from '../../services/propertyService';

const PropertyTransferHistory = ({ propertyId }) => {
  const [transferHistory, setTransferHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = 'ETB') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'ETB' ? 'USD' : currency,
      minimumFractionDigits: 0
    }).format(amount).replace('$', currency + ' ');
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
      case 'verification_pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'initiated':
      case 'documents_pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get transfer type display name
  const getTransferTypeDisplay = (type) => {
    switch (type) {
      case 'sale':
        return 'Sale';
      case 'inheritance':
        return 'Inheritance';
      case 'gift':
        return 'Gift';
      case 'court_order':
        return 'Court Order';
      case 'government_acquisition':
        return 'Government Acquisition';
      case 'exchange':
        return 'Exchange';
      default:
        return type || 'Other';
    }
  };

  // Fetch transfer history
  useEffect(() => {
    const fetchTransferHistory = async () => {
      try {
        setLoading(true);
        const data = await getPropertyTransferHistory(propertyId);
        setTransferHistory(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch transfer history');
        toast.error('Failed to fetch transfer history');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchTransferHistory();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!transferHistory || transferHistory.totalTransfers === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Transfer History</h3>
        <p className="text-gray-600">This property has no transfer history records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Total Transfers</p>
              <p className="text-2xl font-bold text-blue-900">{transferHistory.totalTransfers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">{transferHistory.completedTransfers?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-red-600">Rejected/Cancelled</p>
              <p className="text-2xl font-bold text-red-900">{transferHistory.rejectedTransfers?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Transfer */}
      {transferHistory.currentTransfer && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-6 w-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-900">Current Transfer in Progress</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-yellow-700 mb-1">Transfer Type</p>
              <p className="font-medium text-yellow-900">{getTransferTypeDisplay(transferHistory.currentTransfer.transferType)}</p>
            </div>
            <div>
              <p className="text-sm text-yellow-700 mb-1">Status</p>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(transferHistory.currentTransfer.status)} capitalize`}>
                {transferHistory.currentTransfer.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <p className="text-sm text-yellow-700 mb-1">From</p>
              <p className="font-medium text-yellow-900">{transferHistory.currentTransfer.previousOwner?.fullName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-yellow-700 mb-1">To</p>
              <p className="font-medium text-yellow-900">{transferHistory.currentTransfer.newOwner?.fullName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-yellow-700 mb-1">Initiated Date</p>
              <p className="font-medium text-yellow-900">{formatDate(transferHistory.currentTransfer.initiationDate)}</p>
            </div>
            {transferHistory.currentTransfer.transferValue?.amount && (
              <div>
                <p className="text-sm text-yellow-700 mb-1">Transfer Value</p>
                <p className="font-medium text-yellow-900">
                  {formatCurrency(transferHistory.currentTransfer.transferValue.amount, transferHistory.currentTransfer.transferValue.currency)}
                </p>
              </div>
            )}
          </div>
          
          {transferHistory.currentTransfer.transferReason && (
            <div className="mt-4">
              <p className="text-sm text-yellow-700 mb-1">Reason</p>
              <p className="text-yellow-900">{transferHistory.currentTransfer.transferReason}</p>
            </div>
          )}
        </div>
      )}

      {/* Transfer History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer History</h3>
        
        {transferHistory.transferHistory && transferHistory.transferHistory.length > 0 ? (
          <div className="space-y-4">
            {transferHistory.transferHistory.map((transfer, index) => (
              <div key={transfer._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-medium mr-3">
                      #{index + 1}
                    </span>
                    <h4 className="text-lg font-medium text-gray-900">
                      {getTransferTypeDisplay(transfer.transferType)}
                    </h4>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadgeClass(transfer.status)} capitalize`}>
                    {transfer.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="font-medium text-gray-900">{transfer.previousOwner?.fullName || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-medium text-gray-900">{transfer.newOwner?.fullName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-gray-500">Initiated</p>
                      <p className="font-medium">{formatDate(transfer.initiationDate)}</p>
                    </div>
                  </div>
                  
                  {transfer.completionDate && (
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      <div>
                        <p className="text-gray-500">Completed</p>
                        <p className="font-medium">{formatDate(transfer.completionDate)}</p>
                      </div>
                    </div>
                  )}
                  
                  {transfer.transferValue?.amount && (
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-gray-500">Value</p>
                        <p className="font-medium">
                          {formatCurrency(transfer.transferValue.amount, transfer.transferValue.currency)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-gray-500">Documents</p>
                      <p className="font-medium">{transfer.documents?.length || 0}</p>
                    </div>
                  </div>
                </div>
                
                {transfer.transferReason && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-500 mb-1">Reason</p>
                    <p className="text-gray-900">{transfer.transferReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No transfer records found.
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyTransferHistory;

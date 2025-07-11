import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import * as paymentService from '../../services/paymentService';
import * as userService from '../../services/userService';
import * as propertyService from '../../services/propertyService';

const Payments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = 'ETB') => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch payments
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch payments from API
      const paymentsData = await paymentService.getAllPayments({
        page: currentPage,
        limit,
        status: statusFilter || undefined,
        search: searchTerm || undefined
      });

      // Set payments and pagination
      if (paymentsData && paymentsData.payments) {
        setPayments(paymentsData.payments);
        setTotalPages(paymentsData.pagination?.pages || 1);
      } else {
        // If no payments found, set empty array
        setPayments([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to fetch payments');
      setPayments([]);
      setTotalPages(1);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  // Handle view payment
  const handleViewPayment = async (paymentId) => {
    try {
      // Find the payment in our current list first
      let payment = payments.find(p => p._id === paymentId);

      if (!payment) {
        // If not found in current list, fetch from API
        payment = await paymentService.getPaymentById(paymentId);
      }

      if (payment) {
        setSelectedPayment(payment);
        setShowPaymentModal(true);
      } else {
        toast.error('Payment not found');
      }
    } catch (err) {
      console.error('Error fetching payment details:', err);
      toast.error('Failed to fetch payment details');
    }
  };

  // Handle verify payment
  const handleVerifyPayment = async () => {
    try {
      // Verify payment via API
      await paymentService.verifyPayment(selectedPayment._id, {
        notes: verificationNotes
      });

      // Update local state
      const updatedPayments = payments.map(payment => {
        if (payment._id === selectedPayment._id) {
          return {
            ...payment,
            status: 'completed',
            verifiedBy: 'admin',
            verificationDate: new Date().toISOString(),
            verificationNotes: verificationNotes
          };
        }
        return payment;
      });

      setPayments(updatedPayments);
      setShowVerifyModal(false);
      setSelectedPayment(null);
      setVerificationNotes('');
      toast.success('Payment verified successfully');
    } catch (err) {
      console.error('Error verifying payment:', err);
      toast.error(err.message || 'Failed to verify payment');
    }
  };

  // Handle reject payment
  const handleRejectPayment = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      // Reject payment via API
      await paymentService.rejectPayment(selectedPayment._id, {
        reason: rejectionReason
      });

      // Update local state
      const updatedPayments = payments.map(payment => {
        if (payment._id === selectedPayment._id) {
          return {
            ...payment,
            status: 'rejected',
            verifiedBy: 'admin',
            verificationDate: new Date().toISOString(),
            verificationNotes: rejectionReason
          };
        }
        return payment;
      });

      setPayments(updatedPayments);
      setShowRejectModal(false);
      setSelectedPayment(null);
      setRejectionReason('');
      toast.success('Payment rejected successfully');
    } catch (err) {
      console.error('Error rejecting payment:', err);
      toast.error(err.message || 'Failed to reject payment');
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPayments();
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
    setTimeout(() => {
      fetchPayments();
    }, 100);
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      // Create CSV content
      const headers = ['ID', 'Reference', 'Amount', 'Status', 'Payment Date', 'Payment Method', 'User', 'Property'];
      const csvContent = [
        headers.join(','),
        ...payments.map(payment => [
          payment._id,
          payment.reference,
          payment.amount,
          payment.status,
          formatDate(payment.paymentDate),
          payment.paymentMethod,
          payment.user?.fullName || 'Unknown',
          payment.property?.plotNumber || 'Unknown'
        ].join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Payments exported successfully');
    } catch (err) {
      toast.error('Failed to export payments');
    }
  };

  // Load payments on component mount
  useEffect(() => {
    fetchPayments();
  }, [currentPage]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <CurrencyDollarIcon className="h-7 w-7 mr-2 text-primary" />
            Payment Management
          </h1>
          <button
            onClick={handleExportCSV}
            className="mt-4 md:mt-0 bg-ethiopian-green text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
            Export to CSV
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="w-full md:w-1/2">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search by reference or ID..."
                  className="form-input rounded-r-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark flex items-center"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
                  Search
                </button>
              </div>
            </form>
            <div className="w-full md:w-48">
              <select
                className="form-input w-full"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2">Loading payments...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.reference}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.paymentMethod}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.user?.fullName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.user?.email || 'No email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.property?.plotNumber || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(payment.status)}`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(payment.paymentDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewPayment(payment._id)}
                            className="text-primary hover:text-primary-dark mr-3 flex items-center"
                          >
                            <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                          {payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowVerifyModal(true);
                                }}
                                className="text-green-600 hover:text-green-800 mr-3 flex items-center"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Verify
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowRejectModal(true);
                                }}
                                className="text-accent hover:text-accent-dark flex items-center"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {payments.length} of {totalPages * limit} payments
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setCurrentPage(Math.max(1, currentPage - 1));
                  }}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                  }}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Reference</p>
                <p className="font-medium">{selectedPayment.reference}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedPayment.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Date</p>
                <p className="font-medium">{formatDate(selectedPayment.paymentDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">User</p>
                <p className="font-medium">{selectedPayment.user?.fullName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Property</p>
                <p className="font-medium">{selectedPayment.property?.plotNumber || 'Unknown'}</p>
              </div>

              {selectedPayment.verificationDate && (
                <div>
                  <p className="text-sm text-gray-500">Verification Date</p>
                  <p className="font-medium">{formatDate(selectedPayment.verificationDate)}</p>
                </div>
              )}

              {selectedPayment.verificationNotes && (
                <div>
                  <p className="text-sm text-gray-500">Verification Notes</p>
                  <p className="p-2 bg-gray-50 rounded mt-1">{selectedPayment.verificationNotes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Payment Modal */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Verify Payment</h2>
            <p className="mb-4">
              Are you sure you want to verify the payment with reference <span className="font-semibold">{selectedPayment.reference}</span>?
            </p>
            <div className="mb-4">
              <label htmlFor="verificationNotes" className="form-label">
                Verification Notes (Optional)
              </label>
              <textarea
                id="verificationNotes"
                className="form-input"
                rows="3"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add any notes about this payment verification"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Verify Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Reject Payment</h2>
            <p className="mb-4">
              Are you sure you want to reject the payment with reference <span className="font-semibold">{selectedPayment.reference}</span>?
            </p>
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="form-label">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectionReason"
                className="form-input"
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejecting this payment"
                required
              ></textarea>
              {!rejectionReason && (
                <p className="text-red-500 text-sm mt-1">Reason is required</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPayment}
                disabled={!rejectionReason}
                className={`px-4 py-2 rounded-md ${
                  !rejectionReason
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent-dark'
                }`}
              >
                Reject Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

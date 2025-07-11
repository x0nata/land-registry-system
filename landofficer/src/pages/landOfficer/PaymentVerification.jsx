import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getAllPayments, verifyPayment, rejectPayment, downloadReceipt } from '../../services/paymentService';

const PaymentVerification = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Fetch payments on component mount and when filters change
  useEffect(() => {
    fetchPayments();
  }, [currentPage, statusFilter, typeFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        limit,
        status: statusFilter || undefined,
        paymentType: typeFilter || undefined,
        search: searchTerm || undefined
      };

      const response = await getAllPayments(filters);
      setPayments(response.payments || []);
      setTotalPages(response.totalPages || 1);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch payments');
      setLoading(false);
      toast.error(err.message || 'Failed to fetch payments');
    }
  };

  const handleVerifyPayment = async (isVerified) => {
    try {
      if (isVerified) {
        await verifyPayment(selectedPayment._id, verificationNotes);
      } else {
        await rejectPayment(selectedPayment._id, verificationNotes);
      }

      setShowPaymentModal(false);
      setSelectedPayment(null);
      setVerificationNotes('');

      toast.success(`Payment ${isVerified ? 'verified' : 'rejected'} successfully`);
      fetchPayments();
    } catch (err) {
      toast.error(err.message || 'Failed to verify payment');
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      await downloadReceipt(paymentId);
      toast.success('Receipt downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to download receipt');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPayments();
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

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
  const formatCurrency = (amount, currency) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case undefined:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment type display name
  const getPaymentTypeDisplay = (type) => {
    switch (type) {
      case 'registration_fee':
        return 'Registration Fee';
      case 'certificate_fee':
        return 'Certificate Fee';
      case 'transfer_fee':
        return 'Transfer Fee';
      case 'modification_fee':
        return 'Modification Fee';
      default:
        return type.replace('_', ' ');
    }
  };

  // Get payment method display name
  const getPaymentMethodDisplay = (method) => {
    switch (method) {
      case 'cbe_birr':
        return 'CBE Birr';
      case 'telebirr':
        return 'TeleBirr';
      case 'amole':
        return 'Amole';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method ? method.replace('_', ' ') : 'N/A';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Payment Verification</h1>
            <p className="text-gray-600">Verify and validate property payments</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center text-sm">
              <div className="flex items-center mr-4">
                <span className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></span>
                <span>Pending</span>
              </div>
              <div className="flex items-center mr-4">
                <span className="w-3 h-3 rounded-full bg-green-400 mr-1"></span>
                <span>Verified</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-400 mr-1"></span>
                <span>Rejected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-grow">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search by property, owner, or transaction ID..."
                  className="form-input rounded-r-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
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
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                className="form-input w-full"
                value={typeFilter}
                onChange={handleTypeFilterChange}
              >
                <option value="">All Types</option>
                <option value="registration_fee">Registration Fee</option>
                <option value="certificate_fee">Certificate Fee</option>
                <option value="transfer_fee">Transfer Fee</option>
                <option value="modification_fee">Modification Fee</option>
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
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment._id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.property?.plotNumber || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.property?.propertyType || 'Unknown'} property
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.owner?.fullName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.owner?.email || 'No email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getPaymentTypeDisplay(payment.paymentType)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getPaymentMethodDisplay(payment.paymentMethod)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(payment.paymentDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(payment.verificationStatus)}`}>
                            {payment.verificationStatus === 'verified' ? 'Verified' :
                             payment.verificationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDownloadReceipt(payment._id)}
                            className="text-primary hover:text-primary-dark mr-3"
                            title="Download Receipt"
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </button>
                          {payment.verificationStatus === undefined && (
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setVerificationNotes('');
                                setShowPaymentModal(true);
                              }}
                              className="text-secondary hover:text-secondary-dark"
                              title="Verify Payment"
                            >
                              <CurrencyDollarIcon className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Showing page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
            )}
          </>
        )}
      </div>

      {/* Payment Verification Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Verify Payment</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Payment ID</p>
              <p className="font-medium">{selectedPayment._id}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Property</p>
              <p className="font-medium">{selectedPayment.property?.plotNumber || 'N/A'}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Owner</p>
              <p className="font-medium">{selectedPayment.owner?.fullName || 'Unknown'}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Payment Type</p>
              <p className="font-medium">{getPaymentTypeDisplay(selectedPayment.paymentType)}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium">{getPaymentMethodDisplay(selectedPayment.paymentMethod)}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="font-medium">{selectedPayment.transactionId || 'N/A'}</p>
            </div>
            <div className="mb-4">
              <label htmlFor="verificationNotes" className="form-label">
                Verification Notes
              </label>
              <textarea
                id="verificationNotes"
                className="form-input"
                rows="3"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add any notes about this payment"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyPayment(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <XCircleIcon className="h-5 w-5 mr-1" />
                Reject
              </button>
              <button
                onClick={() => handleVerifyPayment(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <CheckCircleIcon className="h-5 w-5 mr-1" />
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerification;

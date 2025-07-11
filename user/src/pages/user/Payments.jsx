import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CurrencyDollarIcon, CreditCardIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Payments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Empty data
  useEffect(() => {
    // In a real app, this would be an API call to fetch user's payments
    const mockProperties = [];
    const mockPayments = [];

    setProperties(mockProperties);
    setPayments(mockPayments);
    setFilteredPayments(mockPayments);
    setLoading(false);
  }, []);

  // Filter payments based on search term and status
  useEffect(() => {
    let filtered = payments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment => {
        const property = properties.find(p => p.id === payment.propertyId);
        return (
          payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (property && property.plotNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
          payment.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    setFilteredPayments(filtered);
  }, [searchTerm, filterStatus, payments, properties]);

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
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Handle payment
  const handlePayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  // Process payment
  const processPayment = () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessingPayment(true);

    // Simulate payment processing
    setTimeout(() => {
      // Update payment in state
      const updatedPayments = payments.map(p => {
        if (p.id === selectedPayment.id) {
          return {
            ...p,
            status: 'completed',
            paymentDate: new Date().toISOString(),
            paymentMethod: paymentMethod,
            transactionId: `TRX${Math.floor(Math.random() * 1000000)}`
          };
        }
        return p;
      });

      setPayments(updatedPayments);
      setFilteredPayments(updatedPayments);
      setProcessingPayment(false);
      setShowPaymentModal(false);
      setPaymentMethod('');
      toast.success('Payment completed successfully');
    }, 2000);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[70vh]">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Payments</h1>
          <p className="text-gray-600">Manage your property-related payments</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by payment ID, property, or description..."
              className="form-input w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="form-input w-full"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <CurrencyDollarIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold">No Payments Found</h2>
          <p className="mt-2 text-gray-500">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'You have no payments to display'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    Description
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
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => {
                  const property = properties.find(p => p.id === payment.propertyId);
                  return (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {property ? property.plotNumber : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(payment.status)} capitalize`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getPaymentMethodDisplay(payment.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {payment.status === 'pending' ? (
                          <button
                            onClick={() => handlePayment(payment)}
                            className="text-primary hover:text-primary-dark"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Make Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">
                <span className="font-medium">Property:</span>{' '}
                {properties.find(p => p.id === selectedPayment.propertyId)?.plotNumber || 'N/A'}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Description:</span> {selectedPayment.description}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Amount:</span>{' '}
                {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
              </p>
            </div>

            <div className="mb-6">
              <label className="form-label">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  className={`border rounded-md p-3 flex flex-col items-center ${
                    paymentMethod === 'cbe_birr' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('cbe_birr')}
                >
                  <CreditCardIcon className="h-6 w-6 text-primary mb-1" />
                  <span>CBE Birr</span>
                </button>
                <button
                  type="button"
                  className={`border rounded-md p-3 flex flex-col items-center ${
                    paymentMethod === 'telebirr' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('telebirr')}
                >
                  <CreditCardIcon className="h-6 w-6 text-primary mb-1" />
                  <span>TeleBirr</span>
                </button>
                <button
                  type="button"
                  className={`border rounded-md p-3 flex flex-col items-center ${
                    paymentMethod === 'amole' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('amole')}
                >
                  <CreditCardIcon className="h-6 w-6 text-primary mb-1" />
                  <span>Amole</span>
                </button>
                <button
                  type="button"
                  className={`border rounded-md p-3 flex flex-col items-center ${
                    paymentMethod === 'bank_transfer' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('bank_transfer')}
                >
                  <CreditCardIcon className="h-6 w-6 text-primary mb-1" />
                  <span>Bank Transfer</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 mr-2"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md flex items-center ${
                  paymentMethod
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={processPayment}
                disabled={!paymentMethod || processingPayment}
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    Complete Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

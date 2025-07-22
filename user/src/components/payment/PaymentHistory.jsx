import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { PaymentStatusBadge } from './PaymentStatusIndicator';

const PaymentHistory = ({ propertyId = null, userId = null }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchPayments();
  }, [propertyId, userId]);

  const fetchPayments = async () => {
    try {
      let endpoint = '/payments/user';
      if (propertyId) {
        endpoint = `/payments/property/${propertyId}`;
      }

      const response = await api.get(endpoint);
      const result = response.data;
      setPayments(Array.isArray(result) ? result : result.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error loading payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`);
      const receiptData = response.data;

      // Create downloadable receipt
      const receiptContent = `
PAYMENT RECEIPT
===============

Receipt Number: ${receiptData.receipt.receiptNumber}
Transaction ID: ${receiptData.receipt.transactionId}
Date: ${new Date(receiptData.receipt.paymentDate).toLocaleDateString()}
Amount: ${receiptData.receipt.amount} ${receiptData.receipt.currency}
Payment Method: ${receiptData.receipt.paymentMethod.toUpperCase()}

Property Details:
Plot Number: ${receiptData.receipt.property.plotNumber}
Property Type: ${receiptData.receipt.property.propertyType}

Customer:
Name: ${receiptData.receipt.customer.name}
Email: ${receiptData.receipt.customer.email}

Ethiopian Land Registry Authority
Generated: ${new Date().toLocaleString()}
      `;

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptData.receipt.receiptNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Error downloading receipt');
    }
  };

  const getPaymentMethodDisplay = (method) => {
    switch (method) {
      case 'cbe_birr':
        return 'CBE Birr';
      case 'telebirr':
        return 'TeleBirr';
      case 'chapa':
        return 'Chapa';
      case 'credit_card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method?.charAt(0).toUpperCase() + method?.slice(1) || 'Unknown';
    }
  };

  const filteredAndSortedPayments = payments
    .filter(payment => {
      if (filter !== 'all' && payment.status !== filter) return false;
      if (searchTerm && !payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !payment.property?.plotNumber?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'method':
          aValue = a.paymentMethod;
          bValue = b.paymentMethod;
          break;
        default: // date
          aValue = new Date(a.paymentDate);
          bValue = new Date(b.paymentDate);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {filteredAndSortedPayments.length} payment{filteredAndSortedPayments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by transaction ID or plot number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="status-asc">Status A-Z</option>
            <option value="method-asc">Payment Method</option>
          </select>
        </div>
      </div>

      {/* Payment List */}
      {filteredAndSortedPayments.length === 0 ? (
        <div className="text-center py-8">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {payments.length === 0 ? 'No payments found' : 'No payments match your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedPayments.map((payment) => (
            <div key={payment._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <PaymentStatusBadge status={payment.status} />
                    <span className="text-sm text-gray-500">
                      {getPaymentMethodDisplay(payment.paymentMethod)}
                    </span>
                    {payment.property?.plotNumber && (
                      <span className="text-sm text-gray-500">
                        Plot: {payment.property.plotNumber}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Transaction ID:</span>
                      <p className="font-mono text-gray-900">{payment.transactionId}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <p className="font-semibold text-gray-900">
                        {payment.amount?.toLocaleString()} {payment.currency}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="text-gray-900">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {payment.status === 'completed' && payment.receiptNumber && (
                    <button
                      onClick={() => handleDownloadReceipt(payment._id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Download Receipt"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {/* Handle view details */}}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {payment.notes && (
                <div className="mt-3 p-2 bg-gray-100 rounded text-sm text-gray-600">
                  <strong>Note:</strong> {payment.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;

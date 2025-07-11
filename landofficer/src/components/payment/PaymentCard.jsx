import { useState } from 'react';
import { 
  CurrencyDollarIcon, 
  ReceiptRefundIcon, 
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const PaymentCard = ({ payment, onViewReceipt, onDownloadReceipt, onUploadReceipt, onViewInvoice, onDownloadInvoice }) => {
  const [showActions, setShowActions] = useState(false);
  
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
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get payment type display name
  const getPaymentTypeDisplay = (type) => {
    switch (type) {
      case 'registration_fee':
        return 'Registration Fee';
      case 'tax':
        return 'Property Tax';
      case 'transfer_fee':
        return 'Transfer Fee';
      case 'other':
        return 'Other Payment';
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
        return 'Telebirr';
      case 'credit_card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      default:
        return method.replace('_', ' ');
    }
  };
  
  return (
    <div 
      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start">
        <div className="mr-4">
          <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
        </div>
        
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{getPaymentTypeDisplay(payment.paymentType)}</h4>
              <p className="text-gray-600 text-sm">
                {formatCurrency(payment.amount, payment.currency)}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(payment.status)} capitalize`}>
              {payment.status}
            </span>
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            <p>Payment Method: {getPaymentMethodDisplay(payment.paymentMethod)}</p>
            <p>Date: {formatDate(payment.paymentDate || payment.createdAt)}</p>
            {payment.transactionId && (
              <p>Transaction ID: {payment.transactionId}</p>
            )}
          </div>
          
          {payment.status === 'failed' && payment.notes && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
              <p className="font-semibold">Failure Reason:</p>
              <p>{payment.notes}</p>
            </div>
          )}
          
          {payment.status === 'completed' && (
            <div className="mt-2 p-2 bg-green-50 text-green-700 text-sm rounded">
              <p className="font-semibold">Verified:</p>
              <p>Payment verified on {formatDate(payment.verificationDate)}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      {showActions && (
        <div className="mt-4 flex justify-end space-x-2">
          {/* Invoice actions */}
          <button
            onClick={() => onViewInvoice(payment)}
            className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 flex items-center"
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            View Invoice
          </button>
          
          <button
            onClick={() => onDownloadInvoice(payment)}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 flex items-center"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            Download Invoice
          </button>
          
          {/* Receipt actions */}
          {payment.receiptUrl ? (
            <>
              <button
                onClick={() => onViewReceipt(payment)}
                className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 flex items-center"
              >
                <ReceiptRefundIcon className="w-4 h-4 mr-1" />
                View Receipt
              </button>
              
              <button
                onClick={() => onDownloadReceipt(payment)}
                className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 flex items-center"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                Download Receipt
              </button>
            </>
          ) : (
            payment.status === 'pending' && (
              <button
                onClick={() => onUploadReceipt(payment)}
                className="text-sm bg-ethiopian-yellow text-gray-900 px-3 py-1 rounded hover:bg-opacity-90 flex items-center"
              >
                <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
                Upload Receipt
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentCard;

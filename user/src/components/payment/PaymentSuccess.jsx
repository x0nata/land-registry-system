import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  DocumentTextIcon, 
  PrinterIcon,
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const PaymentSuccess = () => {
  const { transactionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get payment data from navigation state or fetch from API
    if (location.state?.payment) {
      setPayment(location.state.payment);
      setLoading(false);
    } else {
      // Fetch payment details from API
      fetchPaymentDetails();
    }
  }, [location.state, transactionId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payments/verify/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setPayment(result.payment);
      } else {
        console.error('Failed to fetch payment details');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`/api/payments/${payment.id}/receipt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const receiptData = await response.json();
        
        // Create a downloadable receipt (simplified version)
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
Location: ${receiptData.receipt.property.location.subCity}, ${receiptData.receipt.property.location.kebele}

Customer:
Name: ${receiptData.receipt.customer.name}
Email: ${receiptData.receipt.customer.email}
Phone: ${receiptData.receipt.customer.phone}

Ethiopian Land Registry Authority
Generated: ${new Date().toLocaleString()}
        `;
        
        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${payment.receiptNumber}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircleIcon className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Your payment has been processed successfully
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium">
              Confirmation Code: <span className="font-mono">{payment.confirmationCode || payment.transactionId}</span>
            </p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <DocumentTextIcon className="h-6 w-6 mr-2" />
            Payment Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Receipt Number</label>
                <p className="text-gray-900 font-mono">{payment.receiptNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                <p className="text-gray-900 font-mono">{payment.transactionId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Method</label>
                <p className="text-gray-900 capitalize">
                  {payment.paymentMethod === 'cbe_birr' ? 'CBE Birr' : 
                   payment.paymentMethod === 'telebirr' ? 'TeleBirr' : 
                   payment.paymentMethod}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Amount Paid</label>
                <p className="text-2xl font-bold text-green-600">
                  {payment.amount?.toLocaleString() || '0'} {payment.currency}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Date</label>
                <p className="text-gray-900">
                  {new Date(payment.completedAt || payment.paymentDate).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            What's Next?
          </h3>
          <div className="space-y-2 text-blue-800">
            <p>✓ Your payment has been confirmed</p>
            <p>✓ Your property registration is now ready for final approval</p>
            <p>✓ A land officer will review and approve your application</p>
            <p>✓ You will receive a notification once approved</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handlePrintReceipt}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print Receipt
            </button>
            
            <button
              onClick={handleDownloadReceipt}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Download Receipt
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Go to Dashboard
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>

        {/* Support Information */}
        <div className="bg-gray-100 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
          <p className="text-gray-600 mb-3">
            If you have any questions about your payment or property registration, please contact us:
          </p>
          <div className="space-y-1 text-sm text-gray-600">
            <p>📧 Email: support@landregistry.gov.et</p>
            <p>📞 Phone: +251-11-123-4567</p>
            <p>🕒 Office Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

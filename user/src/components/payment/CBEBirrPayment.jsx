import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { 
  CreditCardIcon, 
  ShieldCheckIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const CBEBirrPayment = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  // Validation schema for CBE Birr payment
  const validationSchema = Yup.object({
    cbeAccountNumber: Yup.string()
      .required('CBE account number is required')
      .matches(/^[0-9]{10,16}$/, 'Please enter a valid CBE account number (10-16 digits)'),
    cbePin: Yup.string()
      .required('CBE PIN is required')
      .matches(/^[0-9]{4,6}$/, 'PIN must be 4-6 digits')
  });

  // Load transaction details
  useEffect(() => {
    const loadTransaction = async () => {
      try {
        // In a real implementation, this would fetch from the backend
        // For simulation, we'll create mock transaction data
        const mockTransaction = {
          id: transactionId,
          amount: 2500,
          currency: 'ETB',
          description: 'Property Registration Payment',
          merchantName: 'Ethiopian Land Registry',
          propertyPlotNumber: 'PLT-2024-001',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
        };
        
        setTransaction(mockTransaction);
        setLoading(false);
      } catch (error) {
        console.error('Error loading transaction:', error);
        toast.error('Failed to load payment details');
        navigate('/');
      }
    };

    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!transaction) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(transaction.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        toast.error('Payment session has expired');
        navigate('/');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [transaction, navigate]);

  // Format time remaining
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle payment submission
  const handlePayment = async (values, { setSubmitting }) => {
    try {
      setProcessing(true);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(`/api/payments/cbe-birr/process/${transactionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cbeAccountNumber: values.cbeAccountNumber,
          cbePin: values.cbePin
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Payment completed successfully!');
        navigate(`/payment/success/${transactionId}`, {
          state: { 
            payment: result.payment,
            confirmationCode: result.payment.confirmationCode
          }
        });
      } else {
        toast.error(result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            CBE Birr Payment
          </h1>
          <p className="text-center text-gray-600">
            Complete your payment securely with CBE Birr
          </p>
        </div>

        {/* Timer */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-orange-600 mr-2" />
            <span className="text-orange-800 font-medium">
              Session expires in: {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Merchant:</span>
              <span className="font-medium">{transaction.merchantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Property:</span>
              <span className="font-medium">{transaction.propertyPlotNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium">{transaction.description}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-blue-600">
                  {transaction.amount.toLocaleString()} {transaction.currency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Enter CBE Account Details</h2>
          
          <Formik
            initialValues={{
              cbeAccountNumber: '',
              cbePin: ''
            }}
            validationSchema={validationSchema}
            onSubmit={handlePayment}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label htmlFor="cbeAccountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    CBE Account Number
                  </label>
                  <Field
                    type="text"
                    name="cbeAccountNumber"
                    id="cbeAccountNumber"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your CBE account number"
                    maxLength="16"
                  />
                  <ErrorMessage name="cbeAccountNumber" component="div" className="text-red-600 text-sm mt-1" />
                </div>

                <div>
                  <label htmlFor="cbePin" className="block text-sm font-medium text-gray-700 mb-1">
                    CBE PIN
                  </label>
                  <Field
                    type="password"
                    name="cbePin"
                    id="cbePin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your CBE PIN"
                    maxLength="6"
                  />
                  <ErrorMessage name="cbePin" component="div" className="text-red-600 text-sm mt-1" />
                </div>

                {/* Security Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">Secure Payment</p>
                      <p>Your payment information is encrypted and secure. We do not store your PIN.</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || processing}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    `Pay ${transaction.amount.toLocaleString()} ${transaction.currency}`
                  )}
                </button>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel Payment
                </button>
              </Form>
            )}
          </Formik>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Need Help?</p>
              <p>If you're having trouble with your payment, please contact CBE customer service at 8000 or visit your nearest CBE branch.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CBEBirrPayment;

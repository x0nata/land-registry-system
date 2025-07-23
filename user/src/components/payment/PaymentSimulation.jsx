import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  CreditCardIcon, 
  DevicePhoneMobileIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '../../services/api';

const PaymentSimulation = () => {
  const { paymentMethod } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [step, setStep] = useState('processing'); // processing, success, error
  const [processing, setProcessing] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [transactionId, setTransactionId] = useState('');

  const { property, paymentCalculation, merchantInfo } = location.state || {};

  useEffect(() => {
    if (!property || !paymentMethod) {
      toast.error('Invalid payment session');
      navigate('/payments');
      return;
    }

    // Generate transaction ID
    const txId = `${paymentMethod.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    setTransactionId(txId);

    // Simulate payment processing
    simulatePaymentProcess(txId);
  }, [property, paymentMethod, navigate]);

  const simulatePaymentProcess = async (txId) => {
    try {
      setProcessing(true);
      setStep('processing');

      // Simulate processing delay (2-4 seconds)
      const delay = Math.random() * 2000 + 2000;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Initialize payment with backend
      const response = await api.post(`/payments/${paymentMethod}/initialize/${property._id}`, {
        transactionId: txId,
        amount: paymentCalculation?.summary?.totalAmount || 550,
        returnUrl: `${window.location.origin}/payments`
      });

      if (response.data.success) {
        // Simulate successful payment processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Process the payment
        const processResponse = await api.post(`/payments/${paymentMethod}/process/${response.data.transactionId}`, {
          // Simulate payment method specific data
          ...(paymentMethod === 'cbe_birr' ? {
            cbeAccountNumber: '1000123456789',
            cbePin: '****'
          } : {
            telebirrPin: '****'
          })
        });

        if (processResponse.data.success) {
          setPaymentData(processResponse.data.payment);
          setStep('success');
          toast.success('Payment completed successfully!');
        } else {
          throw new Error(processResponse.data.message || 'Payment processing failed');
        }
      } else {
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment simulation error:', error);
      setStep('error');
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReturnToPayments = () => {
    navigate('/payments', { 
      state: { 
        paymentCompleted: step === 'success',
        transactionId: transactionId
      }
    });
  };

  const getPaymentMethodInfo = () => {
    const methods = {
      cbe_birr: {
        name: 'CBE Birr',
        icon: CreditCardIcon,
        color: 'blue',
        description: 'Commercial Bank of Ethiopia'
      },
      telebirr: {
        name: 'TeleBirr',
        icon: DevicePhoneMobileIcon,
        color: 'green',
        description: 'TeleBirr Mobile Wallet'
      }
    };
    return methods[paymentMethod] || methods.cbe_birr;
  };

  const methodInfo = getPaymentMethodInfo();
  const IconComponent = methodInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`bg-${methodInfo.color}-600 text-white p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <IconComponent className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-semibold">{methodInfo.name}</h1>
                <p className="text-sm opacity-90">{methodInfo.description}</p>
              </div>
            </div>
            <button
              onClick={handleReturnToPayments}
              className="text-white hover:text-gray-200"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Details */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Payment Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Property:</span>
                <span className="font-medium">Plot #{property?.plotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">
                  {paymentCalculation?.summary?.totalAmount || 550} ETB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-xs">{transactionId}</span>
              </div>
              {merchantInfo && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Merchant ID:</span>
                  <span className="font-mono text-xs">{merchantInfo.merchantId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Processing State */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <ClockIcon className="h-16 w-16 mx-auto text-blue-500 animate-spin mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
              <p className="text-gray-600 mb-4">
                Please wait while we process your payment...
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Do not close this window or navigate away during payment processing.
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your payment has been processed successfully.
              </p>
              {paymentData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Confirmation Code:</span>
                      <span className="font-mono font-medium">{paymentData.confirmationCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Date:</span>
                      <span>{new Date(paymentData.completedDate).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleReturnToPayments}
                className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors"
              >
                Return to Payments
              </button>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="text-center py-8">
              <XCircleIcon className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-4">
                There was an error processing your payment. Please try again.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => simulatePaymentProcess(transactionId)}
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
                  disabled={processing}
                >
                  {processing ? 'Retrying...' : 'Try Again'}
                </button>
                <button
                  onClick={handleReturnToPayments}
                  className="w-full bg-gray-600 text-white py-3 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Return to Payments
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSimulation;

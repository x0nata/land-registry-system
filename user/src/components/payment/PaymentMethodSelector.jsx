import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  CreditCardIcon, 
  DevicePhoneMobileIcon, 
  BanknotesIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const PaymentMethodSelector = ({ propertyId, onPaymentInitiated }) => {
  const navigate = useNavigate();
  const [paymentCalculation, setPaymentCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => {
    fetchPaymentCalculation();
  }, [propertyId]);

  const fetchPaymentCalculation = async () => {
    try {
      const response = await fetch(`/api/payments/calculate/${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentCalculation(result.calculation);
      } else {
        toast.error('Failed to calculate payment amount');
      }
    } catch (error) {
      console.error('Error calculating payment:', error);
      toast.error('Error calculating payment amount');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = async (method) => {
    if (initiating) return;
    
    setInitiating(true);
    setSelectedMethod(method);

    try {
      let endpoint;
      switch (method) {
        case 'cbe_birr':
          endpoint = `/api/payments/cbe-birr/initialize/${propertyId}`;
          break;
        case 'telebirr':
          endpoint = `/api/payments/telebirr/initialize/${propertyId}`;
          break;
        case 'chapa':
          endpoint = `/api/payments/chapa/initialize/${propertyId}`;
          break;
        default:
          throw new Error('Invalid payment method');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/property/${propertyId}`
        })
      });

      const result = await response.json();

      if (result.success) {
        if (onPaymentInitiated) {
          onPaymentInitiated(result);
        }

        // Redirect to payment interface
        if (method === 'cbe_birr') {
          navigate(`/payment/cbe-birr/${result.transactionId}`);
        } else if (method === 'telebirr') {
          navigate(`/payment/telebirr/${result.transactionId}`);
        } else if (method === 'chapa' && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        }
      } else {
        toast.error(result.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error('Failed to initialize payment');
    } finally {
      setInitiating(false);
      setSelectedMethod(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentCalculation) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" />
          <p>Unable to calculate payment amount. Please try again.</p>
        </div>
      </div>
    );
  }

  const paymentMethods = [
    {
      id: 'cbe_birr',
      name: 'CBE Birr',
      description: 'Pay using your Commercial Bank of Ethiopia account',
      icon: CreditCardIcon,
      color: 'blue',
      processingTime: '2-5 minutes',
      features: ['Secure bank transfer', 'Instant confirmation', 'No additional fees']
    },
    {
      id: 'telebirr',
      name: 'TeleBirr',
      description: 'Pay using your TeleBirr mobile wallet',
      icon: DevicePhoneMobileIcon,
      color: 'green',
      processingTime: '1-3 minutes',
      features: ['Mobile payment', 'Quick & easy', 'SMS confirmation']
    },
    {
      id: 'chapa',
      name: 'Chapa',
      description: 'Pay with credit/debit card or other methods',
      icon: BanknotesIcon,
      color: 'purple',
      processingTime: '3-7 minutes',
      features: ['Multiple payment options', 'International cards', 'Secure processing']
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Payment Method</h2>
      
      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Registration Fee:</span>
            <span className="font-medium">{paymentCalculation.summary.baseFee.toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Processing Fee:</span>
            <span className="font-medium">{paymentCalculation.summary.processingFee.toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax Amount:</span>
            <span className="font-medium">{paymentCalculation.summary.taxAmount.toLocaleString()} ETB</span>
          </div>
          {paymentCalculation.summary.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span className="font-medium">-{paymentCalculation.summary.discountAmount.toLocaleString()} ETB</span>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex justify-between text-xl font-bold">
              <span>Total Amount:</span>
              <span className="text-blue-600">{paymentCalculation.summary.totalAmount.toLocaleString()} ETB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          const isSelected = selectedMethod === method.id;
          const isProcessing = initiating && isSelected;
          
          return (
            <div
              key={method.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected 
                  ? `border-${method.color}-500 bg-${method.color}-50` 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={() => !isProcessing && handlePaymentMethodSelect(method.id)}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full bg-${method.color}-100`}>
                  <IconComponent className={`h-6 w-6 text-${method.color}-600`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {method.processingTime}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{method.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {method.features.map((feature, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${method.color}-100 text-${method.color}-800`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                
                {isProcessing && (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">Secure Payment Processing</p>
            <p>All payments are processed securely using encrypted connections. Your financial information is protected and never stored on our servers.</p>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-blue-900 mb-2">Need Help Choosing?</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>CBE Birr:</strong> Best for CBE account holders, direct bank transfer</p>
          <p>• <strong>TeleBirr:</strong> Fastest option for mobile wallet users</p>
          <p>• <strong>Chapa:</strong> Most flexible, accepts various payment methods</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;

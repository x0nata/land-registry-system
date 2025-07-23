import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Payments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [paymentCalculation, setPaymentCalculation] = useState(null);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showMerchantInfo, setShowMerchantInfo] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load user properties that need payment
  useEffect(() => {
    fetchPropertiesNeedingPayment();
  }, []);

  const fetchPropertiesNeedingPayment = async () => {
    try {
      setLoading(true);
      console.log('Current user:', user);
      console.log('Fetching properties for user...');

      const response = await api.get('/properties/user');
      console.log('Properties API response:', response.data);

      const allProperties = response.data.properties || [];
      console.log('All user properties:', allProperties);

      // Filter properties that need payment (documents validated but payment not completed)
      const propertiesNeedingPayment = allProperties.filter(property =>
        (property.status === 'documents_validated' || property.documentsValidated === true) &&
        !property.paymentCompleted &&
        property.status !== 'payment_pending' &&
        property.status !== 'payment_completed'
      );

      console.log('Properties needing payment:', propertiesNeedingPayment);

      setProperties(propertiesNeedingPayment);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  // Handle property selection for payment
  const handlePropertySelect = async (property) => {
    try {
      setSelectedProperty(property);
      setShowPaymentMethods(true);
      
      // Fetch payment calculation
      const response = await api.get(`/payments/calculate/${property._id}`);
      setPaymentCalculation(response.data.calculation);
    } catch (error) {
      console.error('Error calculating payment:', error);
      toast.error('Failed to calculate payment amount');
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setShowMerchantInfo(true);
  };

  // Get merchant info for payment method
  const getMerchantInfo = (method) => {
    const merchantInfo = {
      cbe_birr: {
        merchantId: 'CBE-LR-001234',
        merchantName: 'Land Registry Office',
        accountNumber: '1000123456789',
        instructions: 'Use your CBE Birr account to complete the payment'
      },
      telebirr: {
        merchantId: 'TB-LR-567890',
        merchantName: 'Land Registry Office',
        shortCode: '*127*001234#',
        instructions: 'Dial the short code or use TeleBirr app to complete payment'
      }
    };
    return merchantInfo[method];
  };

  // Handle proceeding to payment simulation
  const handleProceedToPayment = () => {
    if (!selectedProperty || !selectedPaymentMethod) {
      toast.error('Please select a property and payment method');
      return;
    }

    // Navigate to payment simulation
    navigate(`/payment-simulation/${selectedPaymentMethod}`, {
      state: {
        property: selectedProperty,
        paymentCalculation,
        merchantInfo: getMerchantInfo(selectedPaymentMethod)
      }
    });
  };

  // Reset payment flow
  const resetPaymentFlow = () => {
    setSelectedProperty(null);
    setPaymentCalculation(null);
    setShowPaymentMethods(false);
    setSelectedPaymentMethod(null);
    setShowMerchantInfo(false);
  };

  // Payment methods configuration
  const paymentMethods = [
    {
      id: 'cbe_birr',
      name: 'CBE Birr',
      description: 'Pay using your Commercial Bank of Ethiopia account',
      icon: CreditCardIcon,
      color: 'blue'
    },
    {
      id: 'telebirr',
      name: 'TeleBirr',
      description: 'Pay using your TeleBirr mobile wallet',
      icon: DevicePhoneMobileIcon,
      color: 'green'
    }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-[70vh]">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Property Payments</h1>
          <p className="text-gray-600">Complete payments for your property registrations</p>
        </div>
        {selectedProperty && (
          <button
            onClick={resetPaymentFlow}
            className="mt-4 md:mt-0 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to Properties
          </button>
        )}
      </div>

      {/* Step 1: Property Selection */}
      {!selectedProperty && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Select Property for Payment</h2>
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <CurrencyDollarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Ready for Payment</h3>
              <p className="text-gray-600">
                You don't have any properties that are ready for payment. Properties must have validated documents before payment can be processed.
              </p>
              <Link
                to="/properties"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View My Properties
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {properties.map((property) => (
                <div
                  key={property._id}
                  className="border rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => handlePropertySelect(property)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Plot #{property.plotNumber}</h3>
                      <p className="text-sm text-gray-600">{property.propertyType} • {property.area} sq.m</p>
                      <p className="text-sm text-gray-600">{property.location?.city}, {property.location?.subCity}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ready for Payment
                      </span>
                      <p className="text-sm text-gray-600 mt-1">Fixed Fee: 550 ETB</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Payment Method Selection */}
      {selectedProperty && showPaymentMethods && !showMerchantInfo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Select Payment Method</h2>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">Payment Details</h3>
            <p className="text-sm text-gray-600">Property: Plot #{selectedProperty.plotNumber}</p>
            <p className="text-sm text-gray-600">
              Amount: {paymentCalculation ? `${paymentCalculation.summary.totalAmount} ETB` : '550 ETB'}
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {paymentMethods.map((method) => {
              const IconComponent = method.icon;
              return (
                <div
                  key={method.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === method.id
                      ? `border-${method.color}-500 bg-${method.color}-50`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full bg-${method.color}-100`}>
                      <IconComponent className={`h-6 w-6 text-${method.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Merchant Information */}
      {selectedProperty && showMerchantInfo && selectedPaymentMethod && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Information</h2>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Payment Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Property:</span>
                <span className="ml-2 font-medium">Plot #{selectedProperty.plotNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium">
                  {paymentCalculation ? `${paymentCalculation.summary.totalAmount} ETB` : '550 ETB'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Payment Method:</span>
                <span className="ml-2 font-medium">
                  {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 border rounded-lg">
            <h3 className="font-medium mb-3">Merchant Information</h3>
            {selectedPaymentMethod && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Merchant ID:</span>
                  <span className="ml-2 font-mono font-medium">
                    {getMerchantInfo(selectedPaymentMethod).merchantId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Merchant Name:</span>
                  <span className="ml-2 font-medium">
                    {getMerchantInfo(selectedPaymentMethod).merchantName}
                  </span>
                </div>
                {selectedPaymentMethod === 'cbe_birr' && (
                  <div>
                    <span className="text-gray-600">Account Number:</span>
                    <span className="ml-2 font-mono font-medium">
                      {getMerchantInfo(selectedPaymentMethod).accountNumber}
                    </span>
                  </div>
                )}
                {selectedPaymentMethod === 'telebirr' && (
                  <div>
                    <span className="text-gray-600">Short Code:</span>
                    <span className="ml-2 font-mono font-medium">
                      {getMerchantInfo(selectedPaymentMethod).shortCode}
                    </span>
                  </div>
                )}
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <p className="text-blue-800 text-sm">
                    {getMerchantInfo(selectedPaymentMethod).instructions}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setShowMerchantInfo(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back to Payment Methods
            </button>
            <button
              onClick={handleProceedToPayment}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>
                  <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

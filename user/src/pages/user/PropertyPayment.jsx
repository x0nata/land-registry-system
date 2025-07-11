import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { getPropertyById } from '../../services/propertyService';
import { initializeChapaPayment, verifyChapaPayment } from '../../services/paymentService';

const PropertyPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [processingFee, setProcessingFee] = useState(0);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const propertyData = await getPropertyById(id);
      setProperty(propertyData);

      // Calculate processing fee
      calculateFee(propertyData);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Failed to load property details');
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = (propertyData) => {
    // Base processing fee structure
    const baseFees = {
      residential: 500,
      commercial: 1000,
      industrial: 1500,
      agricultural: 300
    };

    let fee = baseFees[propertyData.propertyType] || 500;

    // Add area-based fee (1 ETB per square meter)
    if (propertyData.area) {
      fee += propertyData.area * 1;
    }

    setProcessingFee(Math.max(fee, 100)); // Minimum fee of 100 ETB
  };

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);

      // Initialize payment with Chapa
      const paymentResponse = await initializeChapaPayment(
        id,
        `${window.location.origin}/property/${id}`
      );

      if (paymentResponse.success && paymentResponse.checkoutUrl) {
        // Redirect to Chapa checkout
        window.location.href = paymentResponse.checkoutUrl;
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error(getPaymentErrorMessage(error));
    } finally {
      setPaymentLoading(false);
    }
  };

  const canProceedWithPayment = () => {
    return property &&
           property.documentsValidated &&
           !property.paymentCompleted &&
           property.status === 'documents_validated';
  };

  const getStatusMessage = () => {
    if (!property) return '';

    if (!property.documentsValidated) {
      return 'All documents must be validated before payment can be processed.';
    }

    if (property.paymentCompleted) {
      return 'Payment has already been completed for this property.';
    }

    if (property.status === 'approved') {
      return 'This property has already been approved.';
    }

    return '';
  };

  const getPaymentErrorMessage = (error) => {
    if (error.message?.includes('not configured')) {
      return 'Payment service is currently unavailable. Please contact support.';
    }
    return error.message || 'Failed to initialize payment';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
          <button
            onClick={() => navigate('/properties')}
            className="btn-primary"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/property/${id}`)}
          className="flex items-center text-primary hover:text-primary-dark mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Property Details
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Property Payment</h1>
        <p className="text-gray-600 mt-2">Complete your property registration payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Property Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Property Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Plot Number:</span>
              <span className="font-medium">{property.plotNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Property Type:</span>
              <span className="font-medium capitalize">{property.propertyType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Area:</span>
              <span className="font-medium">{property.area} sq m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{property.location.kebele}, {property.location.subCity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                property.status === 'documents_validated' ? 'bg-blue-100 text-blue-800' :
                property.status === 'payment_completed' ? 'bg-green-100 text-green-800' :
                property.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {property.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Details</h2>

          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Processing Fee:</span>
                <span className="text-2xl font-bold text-primary">{processingFee} ETB</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Includes base fee and area-based charges
              </p>
            </div>

            {/* Status Messages */}
            {!canProceedWithPayment() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Payment Not Available</h3>
                    <p className="text-sm text-yellow-700 mt-1">{getStatusMessage()}</p>
                  </div>
                </div>
              </div>
            )}

            {property.paymentCompleted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Payment Completed</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your payment has been successfully processed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Button */}
            {canProceedWithPayment() && (
              <div className="pt-4">
                <button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="w-full btn-primary flex items-center justify-center py-3"
                >
                  {paymentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Initializing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-5 w-5 mr-2" />
                      Pay with Chapa
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  You will be redirected to Chapa's secure payment gateway
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Methods Info */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Accepted Payment Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 text-primary mr-2" />
            <span>CBE Birr</span>
          </div>
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 text-primary mr-2" />
            <span>Telebirr</span>
          </div>
          <div className="flex items-center">
            <CreditCardIcon className="h-6 w-6 text-primary mr-2" />
            <span>Credit/Debit Cards</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyPayment;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  DocumentCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { getPropertyById } from '../../services/propertyService';
import { getPropertyPayments } from '../../services/paymentService';
import PaymentMethodSelector from '../../components/payment/PaymentMethodSelector';

const PropertyPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [documentsStatus, setDocumentsStatus] = useState({
    totalRequired: 4,
    uploaded: 0,
    validated: 0
  });

  useEffect(() => {
    fetchPropertyAndPayments();
  }, [id]);

  const fetchPropertyAndPayments = async () => {
    try {
      setLoading(true);
      const [propertyData, paymentsData] = await Promise.all([
        getPropertyById(id),
        getPropertyPayments(id)
      ]);

      setProperty(propertyData);
      setPayments(paymentsData || []);

      // Check document status
      checkDocumentStatus(propertyData);
    } catch (error) {
      console.error('Error fetching property and payments:', error);
      toast.error('Failed to load property details');
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const checkDocumentStatus = (propertyData) => {
    const requiredDocTypes = ['title_deed', 'id_copy', 'tax_clearance', 'application_form'];
    const documents = propertyData.documents || [];

    const uploaded = documents.length;
    const validated = documents.filter(doc => doc.status === 'verified').length;

    setDocumentsStatus({
      totalRequired: requiredDocTypes.length,
      uploaded,
      validated,
      allUploaded: uploaded >= requiredDocTypes.length,
      allValidated: validated >= requiredDocTypes.length && propertyData.documentsValidated
    });
  };

  const handlePaymentInitiated = (paymentResult) => {
    // Refresh payments after successful payment initiation
    fetchPropertyAndPayments();
    toast.success('Payment initiated successfully!');
  };

  const canProceedWithPayment = () => {
    if (!property) return false;

    // Check if all documents are uploaded and validated
    if (!documentsStatus.allUploaded) {
      return false;
    }

    if (!documentsStatus.allValidated) {
      return false;
    }

    // Check if payment is not already completed
    if (property.paymentCompleted) {
      return false;
    }

    // Check property status
    const validStatuses = ['documents_validated', 'payment_pending'];
    return validStatuses.includes(property.status);
  };

  const getStatusMessage = () => {
    if (!property) return '';

    if (!documentsStatus.allUploaded) {
      return `Please upload all required documents (${documentsStatus.uploaded}/${documentsStatus.totalRequired} uploaded).`;
    }

    if (!documentsStatus.allValidated) {
      return `All documents must be validated before payment (${documentsStatus.validated}/${documentsStatus.totalRequired} validated).`;
    }

    if (property.paymentCompleted) {
      return 'Payment has already been completed for this property.';
    }

    if (property.status === 'approved') {
      return 'This property has already been approved.';
    }

    return '';
  };

  const getWorkflowStage = () => {
    if (!property) return 'loading';

    if (!documentsStatus.allUploaded) return 'document_upload';
    if (!documentsStatus.allValidated) return 'document_validation';
    if (!property.paymentCompleted) return 'payment';
    if (property.status === 'payment_completed') return 'approval_pending';
    if (property.status === 'approved') return 'completed';

    return 'unknown';
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        {/* Document Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <DocumentCheckIcon className="h-5 w-5 mr-2" />
            Document Status
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Documents Uploaded:</span>
              <span className={`font-medium ${documentsStatus.allUploaded ? 'text-green-600' : 'text-yellow-600'}`}>
                {documentsStatus.uploaded}/{documentsStatus.totalRequired}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Documents Validated:</span>
              <span className={`font-medium ${documentsStatus.allValidated ? 'text-green-600' : 'text-yellow-600'}`}>
                {documentsStatus.validated}/{documentsStatus.totalRequired}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm text-gray-600">
                  {Math.round((documentsStatus.validated / documentsStatus.totalRequired) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(documentsStatus.validated / documentsStatus.totalRequired) * 100}%` }}
                ></div>
              </div>
            </div>

            {!documentsStatus.allValidated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex">
                  <ClockIcon className="h-4 w-4 text-yellow-400 mr-2 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    All documents must be validated before payment can proceed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Status Messages */}
          {!canProceedWithPayment() && (
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Payment Not Available</h3>
                    <p className="text-sm text-yellow-700 mt-1">{getStatusMessage()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {property.paymentCompleted && (
            <div className="mb-6">
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
            </div>
          )}

          {/* Payment Method Selector */}
          {canProceedWithPayment() && (
            <PaymentMethodSelector
              propertyId={id}
              onPaymentInitiated={handlePaymentInitiated}
            />
          )}

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Payment History</h3>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{payment.amount} {payment.currency}</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {payment.paymentMethod.replace('_', ' ')} • {payment.paymentType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        payment.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        payment.status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status === 'completed' ? 'VERIFIED' :
                         payment.status === 'rejected' ? 'REJECTED' :
                         payment.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyPayment;

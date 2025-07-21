import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPropertyById } from '../../services/propertyService';
import DocumentManager from '../../components/document/DocumentManager';
import PaymentMethodSelector from '../../components/payment/PaymentMethodSelector';
import PaymentStatusIndicator, { PaymentWorkflowProgress } from '../../components/payment/PaymentStatusIndicator';
import PaymentHistory from '../../components/payment/PaymentHistory';
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentRequirements, setPaymentRequirements] = useState(null);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'documents_pending':
        return 'bg-orange-100 text-orange-800';
      case 'documents_validated':
        return 'bg-blue-100 text-blue-800';
      case 'payment_pending':
        return 'bg-purple-100 text-purple-800';
      case 'payment_completed':
        return 'bg-indigo-100 text-indigo-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Load property data function
  const loadProperty = async () => {
    try {
      setLoading(true);
      const propertyData = await getPropertyById(id);
      setProperty(propertyData);
    } catch (error) {
      console.error('Error fetching property:', error);
      setError('Failed to load property details');
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment requirements
  const fetchPaymentRequirements = async () => {
    try {
      const response = await fetch(`/api/properties/${id}/payment-requirements`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentRequirements(result);
      } else {
        console.error('Failed to fetch payment requirements');
      }
    } catch (error) {
      console.error('Error fetching payment requirements:', error);
    }
  };

  // Handle payment initiated
  const handlePaymentInitiated = (paymentResult) => {
    toast.success('Payment initiated successfully');
    // Refresh payment requirements
    fetchPaymentRequirements();
  };

  // Get workflow steps for progress indicator
  const getWorkflowSteps = () => {
    if (!paymentRequirements) return [];

    const { workflowStatus } = paymentRequirements;

    return [
      {
        id: 'documents',
        label: 'Documents Submitted',
        status: workflowStatus.documentsSubmitted ? 'completed' : 'pending',
        description: workflowStatus.documentsSubmitted ? 'All documents uploaded' : 'Upload required documents'
      },
      {
        id: 'validation',
        label: 'Documents Validated',
        status: workflowStatus.documentsValidated ? 'completed' :
                workflowStatus.documentsSubmitted ? 'current' : 'pending',
        description: workflowStatus.documentsValidated ? 'Documents approved by land officer' : 'Awaiting validation'
      },
      {
        id: 'payment',
        label: 'Payment Required',
        status: workflowStatus.paymentCompleted ? 'completed' :
                workflowStatus.paymentRequired ? 'current' : 'pending',
        description: workflowStatus.paymentCompleted ? 'Payment completed' :
                    workflowStatus.paymentRequired ? 'Complete registration payment' : 'Payment pending validation'
      },
      {
        id: 'approval',
        label: 'Final Approval',
        status: workflowStatus.approved ? 'completed' :
                workflowStatus.readyForApproval ? 'current' : 'pending',
        description: workflowStatus.approved ? 'Registration approved' : 'Awaiting land officer approval'
      }
    ];
  };

  // Fetch property data on component mount
  useEffect(() => {
    if (id) {
      loadProperty();
      fetchPaymentRequirements();
    }
  }, [id]);

  // Handle payment submission
  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (!paymentReference) {
      toast.error('Please enter a payment reference');
      return;
    }

    // In a real app, this would make an API call to submit payment details
    // For now, we'll simulate a successful payment submission

    // Update property data with new payment
    const updatedProperty = { ...property };
    const pendingPayment = updatedProperty.pendingPayments[0];

    // Add payment to completed payments
    updatedProperty.payments.push({
      id: `pay${Date.now()}`,
      type: pendingPayment.type,
      amount: pendingPayment.amount,
      currency: pendingPayment.currency,
      status: 'pending_verification',
      paymentDate: new Date().toISOString(),
      paymentMethod: paymentMethod,
      reference: paymentReference
    });

    // Add to timeline
    updatedProperty.timeline.push({
      date: new Date().toISOString(),
      action: 'Payment Submitted',
      description: `${pendingPayment.type} payment submitted and pending verification`
    });

    // Remove from pending payments
    updatedProperty.pendingPayments = [];

    // Update state
    setProperty(updatedProperty);

    // Close modal and reset form
    setShowPaymentModal(false);
    setPaymentMethod('');
    setPaymentReference('');

    // Show success message
    toast.success('Payment submitted successfully');
  };

  // Handle document upload
  const handleDocumentUpload = (documentType) => {
    // In a real app, this would open a file picker and upload the document
    // For now, we'll simulate a successful document upload

    toast.info('Document upload functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => navigate('/dashboard/user')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <p className="text-gray-700">The property you are looking for does not exist or you do not have permission to view it.</p>
          <button
            onClick={() => navigate('/dashboard/user')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Property Details</h1>
            <p className="text-gray-600">Plot Number: {property.plotNumber}</p>
            <p className="text-gray-600">{property.location?.subCity}, {property.location?.kebele}</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(property.status)} capitalize`}>
              {property.status.replace('_', ' ')}
            </span>
            {paymentRequirements && (
              <PaymentStatusIndicator
                status={property.paymentCompleted ? 'completed' :
                        paymentRequirements.workflowStatus.paymentRequired ? 'required' : 'pending'}
                amount={paymentRequirements.paymentInfo.totalPaid}
                size="sm"
                showAmount={property.paymentCompleted}
              />
            )}
            <Link
              to={`/disputes/submit?property=${property._id}`}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center"
            >
              <ScaleIcon className="h-4 w-4 mr-2" />
              Submit Dispute
            </Link>
            <button
              onClick={() => navigate('/dashboard/user')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Payment Status Section */}
        {property.status === 'documents_validated' && !property.paymentCompleted && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-blue-500 mr-3 mt-0.5" />
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-blue-900">Ready for Payment</h3>
                <p className="text-blue-700 mt-1">
                  All your documents have been validated! You can now proceed with the processing fee payment.
                </p>
                <div className="mt-3">
                  <Link
                    to={`/property/${id}/payment`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Proceed to Payment
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {property.status === 'payment_completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-green-900">Payment Completed</h3>
                <p className="text-green-700 mt-1">
                  Your payment has been successfully processed. Your application is now ready for final approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {property.status === 'documents_pending' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <DocumentTextIcon className="h-6 w-6 text-orange-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-orange-900">Documents Pending Validation</h3>
                <p className="text-orange-700 mt-1">
                  Your documents are currently being reviewed by our land officers. Payment will be available once all documents are validated.
                </p>
              </div>
            </div>
          </div>
        )}

        {property.status === 'payment_pending' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-purple-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-purple-900">Payment Processing</h3>
                <p className="text-purple-700 mt-1">
                  Your payment is currently being processed. Please wait for confirmation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('payments')}
            >
              Payments
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'payment'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('payment')}
            >
              Payment
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'timeline'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-4">Property Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-600">Plot Number:</div>
                  <div>{property.plotNumber}</div>

                  <div className="text-gray-600">Property Type:</div>
                  <div className="capitalize">{property.propertyType}</div>

                  <div className="text-gray-600">Area:</div>
                  <div>{property.area} sq. meters</div>

                  <div className="text-gray-600">Sub-City:</div>
                  <div>{property.location.subCity}</div>

                  <div className="text-gray-600">Kebele:</div>
                  <div>{property.location.kebele}</div>

                  {property.location.streetName && (
                    <>
                      <div className="text-gray-600">Street Name:</div>
                      <div>{property.location.streetName}</div>
                    </>
                  )}

                  {property.location.houseNumber && (
                    <>
                      <div className="text-gray-600">House Number:</div>
                      <div>{property.location.houseNumber}</div>
                    </>
                  )}

                  <div className="text-gray-600">Registration Date:</div>
                  <div>{formatDate(property.registrationDate)}</div>

                  <div className="text-gray-600">Last Updated:</div>
                  <div>{formatDate(property.lastUpdated)}</div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Owner Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-600">Full Name:</div>
                  <div>{property.owner?.fullName || 'N/A'}</div>

                  <div className="text-gray-600">National ID:</div>
                  <div>{property.owner?.nationalId || 'N/A'}</div>

                  <div className="text-gray-600">Phone Number:</div>
                  <div>{property.owner?.phoneNumber || 'N/A'}</div>

                  <div className="text-gray-600">Email Address:</div>
                  <div>{property.owner?.email || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <DocumentManager
              propertyId={property._id}
              onDocumentChange={() => {
                // Reload property data when documents change
                loadProperty();
              }}
            />
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Payments</h2>

            {/* Pending Payments */}
            {property.pendingPayments && property.pendingPayments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium mb-2">Pending Payments</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  {property.pendingPayments.map((payment) => (
                    <div key={payment.id} className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium capitalize">{payment.type.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-gray-600">Amount: {payment.amount} {payment.currency}</p>
                        <p className="text-gray-600">Due Date: {formatDate(payment.dueDate)}</p>
                      </div>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="mt-4 md:mt-0 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                      >
                        Make Payment
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment History */}
            <h3 className="text-md font-medium mb-2">Payment History</h3>
            {property.payments && property.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {property.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {payment.type.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.amount} {payment.currency}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(payment.paymentDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {payment.paymentMethod?.replace('_', ' ') || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.reference || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(payment.status)} capitalize`}>
                            {payment.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No payment history available.</p>
            )}
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6">
            {/* Workflow Progress */}
            <PaymentWorkflowProgress steps={getWorkflowSteps()} />

            {/* Payment Section */}
            {paymentRequirements?.workflowStatus.paymentRequired ? (
              <PaymentMethodSelector
                propertyId={id}
                onPaymentInitiated={handlePaymentInitiated}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {paymentRequirements?.workflowStatus.paymentCompleted
                    ? 'Payment Completed'
                    : 'Payment Not Yet Available'
                  }
                </h3>
                <p className="text-gray-600">
                  {paymentRequirements?.workflowStatus.paymentCompleted
                    ? 'Your payment has been completed successfully. Your property is ready for final approval.'
                    : 'Payment will be available after document validation is complete.'
                  }
                </p>
              </div>
            )}

            {/* Payment History */}
            <PaymentHistory propertyId={id} />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Application Timeline</h2>

            {property.timeline && property.timeline.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Timeline events */}
                <div className="space-y-6">
                  {property.timeline.map((event, index) => (
                    <div key={index} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1.5 w-10 flex items-center justify-center">
                        <div className="w-3.5 h-3.5 bg-primary rounded-full"></div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                          <h3 className="font-medium">{event.action}</h3>
                          <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">No timeline events available yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Make Payment</h2>

            <form onSubmit={handlePaymentSubmit}>
              <div className="mb-4">
                <label className="form-label">Payment Type</label>
                <p className="font-medium capitalize">
                  {property.pendingPayments[0].type.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>

              <div className="mb-4">
                <label className="form-label">Amount</label>
                <p className="font-medium">
                  {property.pendingPayments[0].amount} {property.pendingPayments[0].currency}
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="paymentMethod" className="form-label">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select payment method</option>
                  <option value="cbe_birr">CBE Birr</option>
                  <option value="amole">Amole</option>
                  <option value="telebirr">TeleBirr</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="paymentReference" className="form-label">
                  Payment Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="paymentReference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="form-input"
                  placeholder="Enter transaction ID or reference number"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the transaction ID or reference number from your payment receipt.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;

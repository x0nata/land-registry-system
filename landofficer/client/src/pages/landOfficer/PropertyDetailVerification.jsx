import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  MapIcon,
  UserIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { getPropertyById, approveProperty, rejectProperty, verifyDocument } from '../../services/propertyService';

const PropertyDetailVerification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

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

  // Get document status badge class
  const getDocumentStatusBadgeClass = (verified) => {
    if (verified === true) return 'bg-green-100 text-green-800';
    if (verified === false) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  // Get status badge color (for the modal)
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
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

  // Check if all documents are verified
  const areAllDocumentsVerified = () => {
    if (!property || !property.documents || property.documents.length === 0) {
      // If no documents are required, consider it as verified
      return true;
    }

    // Check if all documents are verified (status === 'verified' OR verified === true)
    const allVerified = property.documents.every(doc =>
      doc.status === 'verified' || doc.verified === true
    );

    // Debug logging
    console.log('Documents verification check:', {
      totalDocs: property.documents.length,
      verifiedDocs: property.documents.filter(doc => doc.status === 'verified' || doc.verified === true).length,
      allVerified,
      documents: property.documents.map(doc => ({
        type: doc.documentType,
        verified: doc.verified,
        status: doc.status
      }))
    });

    return allVerified;
  };

  // Fetch property data
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true);

        const fetchedProperty = await getPropertyById(id);

        // Add timeline if it doesn't exist
        if (!fetchedProperty.timeline) {
          fetchedProperty.timeline = [
            {
              date: fetchedProperty.registrationDate,
              action: 'Application Submitted',
              description: 'Property registration application submitted'
            }
          ];
        }

        setProperty(fetchedProperty);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch property details');
        setLoading(false);
        toast.error('Failed to fetch property details');
      }
    };

    fetchPropertyData();
  }, [id]);

  // Handle document verification
  const handleVerifyDocument = async (isVerified) => {
    try {
      // Call the API to verify the document
      await verifyDocument(property._id, selectedDocument._id, isVerified, verificationNotes);

      // Update the document in the local state
      const updatedProperty = { ...property };
      const docIndex = updatedProperty.documents.findIndex(doc => doc._id === selectedDocument._id);

      if (docIndex !== -1) {
        updatedProperty.documents[docIndex].verified = isVerified;
        updatedProperty.documents[docIndex].status = isVerified ? 'verified' : 'rejected';
        updatedProperty.documents[docIndex].verificationNotes = verificationNotes;
        updatedProperty.documents[docIndex].verifiedAt = new Date().toISOString();
      }

      // Add to timeline
      if (!updatedProperty.timeline) {
        updatedProperty.timeline = [];
      }

      updatedProperty.timeline.push({
        date: new Date().toISOString(),
        action: `Document ${isVerified ? 'Verified' : 'Rejected'}`,
        description: `${selectedDocument.documentType} ${isVerified ? 'verified' : 'rejected'}${verificationNotes ? ': ' + verificationNotes : ''}`
      });

      setProperty(updatedProperty);
      setShowDocumentModal(false);
      setSelectedDocument(null);
      setVerificationNotes('');

      toast.success(`Document ${isVerified ? 'verified' : 'rejected'} successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to verify document');
    }
  };

  // Handle property approval
  const handleApproveProperty = async () => {
    try {
      // Call the API to approve the property
      await approveProperty(property._id, approvalNotes);

      const updatedProperty = { ...property };
      updatedProperty.status = 'approved';
      updatedProperty.approvalDate = new Date().toISOString();
      updatedProperty.approvalNotes = approvalNotes;

      // Add to timeline
      if (!updatedProperty.timeline) {
        updatedProperty.timeline = [];
      }

      updatedProperty.timeline.push({
        date: new Date().toISOString(),
        action: 'Property Approved',
        description: approvalNotes || 'Property registration approved'
      });

      setProperty(updatedProperty);
      setShowApproveModal(false);
      setApprovalNotes('');

      toast.success('Property approved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to approve property');
    }
  };

  // Handle property rejection
  const handleRejectProperty = async () => {
    try {
      // Call the API to reject the property
      await rejectProperty(property._id, rejectionReason);

      const updatedProperty = { ...property };
      updatedProperty.status = 'rejected';
      updatedProperty.rejectionDate = new Date().toISOString();
      updatedProperty.rejectionReason = rejectionReason;

      // Add to timeline
      if (!updatedProperty.timeline) {
        updatedProperty.timeline = [];
      }

      updatedProperty.timeline.push({
        date: new Date().toISOString(),
        action: 'Property Rejected',
        description: rejectionReason
      });

      setProperty(updatedProperty);
      setShowRejectModal(false);
      setRejectionReason('');

      toast.success('Property rejected successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to reject property');
    }
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
            onClick={() => navigate('/property-verification')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Back to Property Verification
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
            onClick={() => navigate('/property-verification')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Back to Property Verification
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
            <button
              onClick={() => navigate('/landofficer/property-verification')}
              className="flex items-center text-primary hover:text-primary-dark mb-2"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Property Verification
            </button>
            <h1 className="text-2xl font-bold">Property Verification</h1>
            <p className="text-gray-600">Plot Number: {property.plotNumber}</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(property.status)} capitalize`}>
              {property.status.replace('_', ' ')}
            </span>
          </div>
        </div>

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
              Property Details
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
              <div className="flex items-center mb-4">
                <HomeIcon className="h-5 w-5 text-primary mr-2" />
                <h2 className="text-lg font-semibold">Property Information</h2>
              </div>
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
              <div className="flex items-center mb-4">
                <UserIcon className="h-5 w-5 text-primary mr-2" />
                <h2 className="text-lg font-semibold">Owner Information</h2>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-600">Full Name:</div>
                  <div>{property.owner.fullName}</div>

                  <div className="text-gray-600">National ID:</div>
                  <div>{property.owner.nationalId}</div>

                  <div className="text-gray-600">Phone Number:</div>
                  <div>{property.owner.phoneNumber}</div>

                  <div className="text-gray-600">Email Address:</div>
                  <div>{property.owner.email}</div>

                  <div className="text-gray-600">Role:</div>
                  <div className="capitalize">{property.owner.role}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-lg font-semibold">Documents</h2>
            </div>

            <div className="space-y-4">
              {property.documents.map((document) => (
                <div key={document._id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{document.documentType}</h3>
                      <p className="text-sm text-gray-600">{document.documentName}</p>
                      <p className="text-sm text-gray-600">Uploaded: {formatDate(document.uploadDate)}</p>
                      {document.verificationNotes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Notes: {document.verificationNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        (document.status === 'verified' || document.verified === true) ? 'bg-green-100 text-green-800' :
                        (document.status === 'rejected' || document.verified === false) ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(document.status === 'verified' || document.verified === true) ? 'Verified' :
                         (document.status === 'rejected' || document.verified === false) ? 'Rejected' : 'Pending'}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedDocument(document);
                          setVerificationNotes(document.verificationNotes || '');
                          setShowDocumentModal(true);
                        }}
                        className="mt-2 text-primary hover:text-primary-dark text-sm"
                      >
                        {(document.status && document.status !== 'pending') || document.verified !== undefined ? 'Update Verification' : 'Verify Document'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <div className="flex items-center mb-4">
              <ClockIcon className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-lg font-semibold">Timeline</h2>
            </div>

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
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 mb-2">Verification Status</p>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(property.status)} capitalize`}>
                  {property.status.replace('_', ' ')}
                </span>
                {property.status === 'pending' && (
                  <span className="ml-2 text-sm text-gray-600">
                    {areAllDocumentsVerified()
                      ? 'All documents verified, ready for approval'
                      : `${property.documents?.filter(doc => doc.status === 'verified' || doc.verified === true).length || 0}/${property.documents?.length || 0} documents verified`}
                  </span>
                )}
              </div>

              {/* Payment Status Information */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Process Status</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Documents Validated:</span>
                    <span className={property.documentsValidated ? 'text-green-600 font-medium' : 'text-red-600'}>
                      {property.documentsValidated ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Completed:</span>
                    <span className={property.paymentCompleted ? 'text-green-600 font-medium' : 'text-red-600'}>
                      {property.paymentCompleted ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ready for Approval:</span>
                    <span className={property.documentsValidated && property.paymentCompleted ? 'text-green-600 font-medium' : 'text-red-600'}>
                      {property.documentsValidated && property.paymentCompleted ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {/* Show buttons based on new flow */}
              {(property.status === 'payment_completed' || property.status === 'under_review') && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
                  >
                    Reject Property
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    disabled={!areAllDocumentsVerified() || !property.paymentCompleted}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      areAllDocumentsVerified() && property.paymentCompleted
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={
                      !areAllDocumentsVerified()
                        ? 'All documents must be verified before approval'
                        : !property.paymentCompleted
                        ? 'Payment must be completed before approval'
                        : 'Approve this property'
                    }
                  >
                    Approve Property
                  </button>
                </>
              )}

              {/* Show status for other stages */}
              {property.status === 'documents_validated' && (
                <div className="text-blue-600 font-medium">
                  ✓ Documents validated - Waiting for payment
                </div>
              )}

              {property.status === 'payment_pending' && (
                <div className="text-purple-600 font-medium">
                  ⏳ Payment processing
                </div>
              )}
              {property.status === 'approved' && (
                <div className="text-green-600 font-medium">
                  ✓ Property has been approved
                </div>
              )}
              {property.status === 'rejected' && (
                <div className="text-red-600 font-medium">
                  ✗ Property has been rejected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Verification Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Verify Document</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Document Type</p>
              <p className="font-medium">{selectedDocument.documentType}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">File Name</p>
              <p className="font-medium">{selectedDocument.documentName}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Upload Date</p>
              <p className="font-medium">{formatDate(selectedDocument.uploadDate)}</p>
            </div>
            <div className="mb-4">
              <label htmlFor="verificationNotes" className="form-label">
                Verification Notes
              </label>
              <textarea
                id="verificationNotes"
                className="form-input"
                rows="3"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add any notes about this document"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDocumentModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyDocument(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reject Document
              </button>
              <button
                onClick={() => handleVerifyDocument(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Verify Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Property Modal */}
      {showApproveModal && property && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">Confirm Property Approval</h2>

            {/* Property and User Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Property Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Property Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Property ID:</span>
                    <span className="text-gray-800">{property._id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Plot Number:</span>
                    <span className="text-gray-800">{property.plotNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Property Type:</span>
                    <span className="text-gray-800 capitalize">{property.propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Area:</span>
                    <span className="text-gray-800">{property.area} sq. meters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Location:</span>
                    <span className="text-gray-800">{property.location?.subCity}, Kebele {property.location?.kebele}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Registration Date:</span>
                    <span className="text-gray-800">{formatDate(property.registrationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Current Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(property.status)}`}>
                      {property.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Property Owner Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Full Name:</span>
                    <span className="text-gray-800">{property.owner?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="text-gray-800">{property.owner?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">National ID:</span>
                    <span className="text-gray-800">{property.owner?.nationalId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Phone:</span>
                    <span className="text-gray-800">{property.owner?.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Role:</span>
                    <span className="text-gray-800 capitalize">{property.owner?.role || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Registration Date:</span>
                    <span className="text-gray-800">{formatDate(property.owner?.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Summary */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Documents Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{property.documents?.length || 0}</div>
                  <div className="text-sm text-gray-600">Total Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {property.documents?.filter(doc => doc.status === 'verified' || doc.verified === true).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Verified</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {property.documents?.filter(doc => doc.status === 'pending' && doc.verified !== true && doc.verified !== false).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {property.documents?.filter(doc => doc.status === 'rejected' || doc.verified === false).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
              </div>
            </div>

            {/* Approval Notes */}
            <div className="mb-6">
              <label htmlFor="approvalNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Approval Notes (Optional)
              </label>
              <textarea
                id="approvalNotes"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows="4"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval (optional)"
              ></textarea>
            </div>

            {/* Confirmation Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Confirm Property Approval
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      By approving this property, you confirm that:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All required documents have been verified and are authentic</li>
                      <li>Property details are accurate and complete</li>
                      <li>Owner information has been validated</li>
                      <li>The property meets all legal requirements for registration</li>
                    </ul>
                    <p className="mt-2 font-medium">
                      This action will change the property status to "Approved" and cannot be easily undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveProperty}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Property Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Reject Property</h2>
            <p className="mb-4">
              Are you sure you want to reject this property? This action will update the property status to rejected.
            </p>
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="form-label">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectionReason"
                className="form-input"
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejecting this property"
                required
              ></textarea>
              {!rejectionReason && (
                <p className="text-red-500 text-sm mt-1">Reason is required</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectProperty}
                disabled={!rejectionReason}
                className={`px-4 py-2 rounded-md ${
                  !rejectionReason
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                Reject Property
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailVerification;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import {
  getAssignedProperties,
  getPropertyById,
  approveProperty,
  rejectProperty,
  verifyDocument
} from '../../services/propertyService';
import { downloadDocument, previewDocument } from '../../services/documentService';

const PropertyVerification = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentVerificationNotes, setDocumentVerificationNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch assigned properties on component mount
  useEffect(() => {
    fetchProperties();
  }, [statusFilter]);

  // Auto-refresh properties every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        console.log('Auto-refreshing property verification data...');
        fetchProperties(true); // Force fresh data
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading]);

  const fetchProperties = async (forceFresh = false) => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter || undefined,
        search: searchTerm || undefined
      };

      // Clear cache if forcing fresh data
      if (forceFresh) {
        // Clear cache to get fresh data
        if (typeof window !== 'undefined' && window.dataCache) {
          window.dataCache.clear();
        }
      }

      const response = await getAssignedProperties(filters);
      setProperties(response.properties || response || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch assigned properties');
      setLoading(false);
      toast.error(err.message || 'Failed to fetch assigned properties');
    }
  };

  const handleViewProperty = async (propertyId) => {
    try {
      setLoading(true);
      const property = await getPropertyById(propertyId);
      setSelectedProperty(property);
      setShowPropertyModal(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch property details');
      setLoading(false);
      toast.error(err.message || 'Failed to fetch property details');
    }
  };

  const handleApproveProperty = async () => {
    try {
      // Check if payment is completed before approval
      if (!selectedProperty.paymentCompleted) {
        toast.error('Cannot approve property. Payment must be completed first.');
        return;
      }

      // Check if documents are validated
      if (!selectedProperty.documentsValidated) {
        toast.error('Cannot approve property. All documents must be validated first.');
        return;
      }

      await approveProperty(selectedProperty._id, approvalNotes);
      setShowApproveModal(false);
      setSelectedProperty(null);
      setApprovalNotes('');
      toast.success('Property approved successfully');
      fetchProperties();
    } catch (err) {
      toast.error(err.message || 'Failed to approve property');
    }
  };

  const handleRejectProperty = async () => {
    try {
      await rejectProperty(selectedProperty._id, rejectionReason);
      setShowRejectModal(false);
      setSelectedProperty(null);
      setRejectionReason('');
      toast.success('Property rejected successfully');
      fetchProperties();
    } catch (err) {
      toast.error(err.message || 'Failed to reject property');
    }
  };

  const handleVerifyDocument = async (isVerified) => {
    try {
      await verifyDocument(
        selectedProperty._id,
        selectedDocument._id,
        isVerified,
        documentVerificationNotes
      );

      // Update the document in the local state
      const updatedProperty = { ...selectedProperty };
      const docIndex = updatedProperty.documents.findIndex(doc => doc._id === selectedDocument._id);

      if (docIndex !== -1) {
        updatedProperty.documents[docIndex].verified = isVerified;
        updatedProperty.documents[docIndex].verificationNotes = documentVerificationNotes;
        updatedProperty.documents[docIndex].verifiedAt = new Date().toISOString();
      }

      setSelectedProperty(updatedProperty);
      setShowDocumentModal(false);
      setSelectedDocument(null);
      setDocumentVerificationNotes('');

      toast.success(`Document ${isVerified ? 'verified' : 'rejected'} successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to verify document');
    }
  };

  const handleDownloadDocument = async (documentId) => {
    try {
      await downloadDocument(documentId);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document: ' + error.message);
    }
  };

  const handlePreviewDocument = async (documentId) => {
    try {
      // Use the previewDocument service function
      await previewDocument(documentId);
      toast.success('Document preview opened');
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to preview document: ' + error.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if all documents are verified
  const areAllDocumentsVerified = (property) => {
    if (!property || !property.documents || property.documents.length === 0) {
      return false;
    }

    return property.documents.every(doc => doc.verified === true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold">Property Verification</h1>
          <button
            onClick={() => fetchProperties(true)}
            disabled={loading}
            className="mt-4 md:mt-0 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh Properties
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-grow">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search by plot number or location..."
                  className="form-input rounded-r-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="w-full md:w-48">
              <select
                className="form-input w-full"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2">Loading properties...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plot Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                        No properties assigned to you
                      </td>
                    </tr>
                  ) : (
                    properties.map((property) => (
                      <tr key={property._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {property.plotNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {property.owner?.fullName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {property.owner?.email || 'No email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {property.location?.subCity || 'N/A'}, {property.location?.kebele || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {property.propertyType}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(property.status)}`}>
                            {property.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {property.documents?.length || 0} document(s)
                          </div>
                          <div className="text-xs text-gray-500">
                            {property.documents?.filter(doc => doc.verified).length || 0} verified
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {property.paymentCompleted ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Completed
                              </span>
                            ) : property.documentsValidated ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                ⏳ Required
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                ⏸ Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/landofficer/property-detail-verification/${property._id}`}
                            className="text-primary hover:text-primary-dark mr-3"
                          >
                            View Details
                          </Link>
                          {property.status === 'pending' && areAllDocumentsVerified(property) && property.paymentCompleted && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setShowApproveModal(true);
                                }}
                                className="text-green-600 hover:text-green-800 mr-3"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setShowRejectModal(true);
                                }}
                                className="text-accent hover:text-accent-dark"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Property Details Modal */}
      {showPropertyModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Plot Number</p>
                <p className="font-medium">{selectedProperty.plotNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="font-medium capitalize">{selectedProperty.propertyType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Area (sq. meters)</p>
                <p className="font-medium">{selectedProperty.area}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedProperty.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">
                  {selectedProperty.location?.subCity || 'N/A'}, {selectedProperty.location?.kebele || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registration Date</p>
                <p className="font-medium">{formatDate(selectedProperty.registrationDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <p className="font-medium">{selectedProperty.owner?.fullName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Owner Contact</p>
                <p className="font-medium">{selectedProperty.owner?.email || 'No email'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <div className="flex items-center space-x-2">
                  {selectedProperty.paymentCompleted ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Payment Completed
                    </span>
                  ) : selectedProperty.documentsValidated ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      ⏳ Payment Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      ⏸ Payment Pending Validation
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedProperty.reviewNotes && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Review Notes</p>
                <p className="p-2 bg-gray-50 rounded mt-1">{selectedProperty.reviewNotes}</p>
              </div>
            )}

            {/* Documents Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Documents</h3>
              {selectedProperty.documents && selectedProperty.documents.length > 0 ? (
                <div className="space-y-2">
                  {selectedProperty.documents.map((doc) => (
                    <div key={doc._id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <p className="font-medium">{doc.documentType}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded: {formatDate(doc.uploadDate)}
                        </p>
                        {doc.verificationNotes && (
                          <p className="text-xs text-gray-500 mt-1">
                            Note: {doc.verificationNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          doc.verified === true ? 'bg-green-100 text-green-800' :
                          doc.verified === false ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.verified === true ? 'Verified' :
                           doc.verified === false ? 'Rejected' : 'Pending'}
                        </span>
                        <button
                          onClick={() => handlePreviewDocument(doc._id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Preview Document"
                        >
                          <MagnifyingGlassIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc._id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                          title="Download Document"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDocument(doc);
                            setDocumentVerificationNotes(doc.verificationNotes || '');
                            setShowDocumentModal(true);
                          }}
                          className="text-primary hover:text-primary-dark text-sm"
                        >
                          {doc.verified !== undefined ? 'Update' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No documents uploaded</p>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <div>
                {selectedProperty.status === 'pending' && areAllDocumentsVerified(selectedProperty) && selectedProperty.paymentCompleted && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setShowPropertyModal(false);
                        setShowApproveModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Approve Property
                    </button>
                    <button
                      onClick={() => {
                        setShowPropertyModal(false);
                        setShowRejectModal(true);
                      }}
                      className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark"
                    >
                      Reject Property
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowPropertyModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              <p className="text-sm text-gray-500">Uploaded On</p>
              <p className="font-medium">{formatDate(selectedDocument.uploadDate)}</p>
            </div>

            {/* Document Actions */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Document Actions</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePreviewDocument(selectedDocument._id)}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                  Preview
                </button>
                <button
                  onClick={() => handleDownloadDocument(selectedDocument._id)}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Download
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="verificationNotes" className="form-label">
                Verification Notes
              </label>
              <textarea
                id="verificationNotes"
                className="form-input"
                rows="3"
                value={documentVerificationNotes}
                onChange={(e) => setDocumentVerificationNotes(e.target.value)}
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
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark"
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
      {showApproveModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Approve Property</h2>
            <p className="mb-4">
              Are you sure you want to approve the property with plot number <span className="font-semibold">{selectedProperty.plotNumber}</span>?
            </p>
            <div className="mb-4">
              <label htmlFor="approvalNotes" className="form-label">
                Approval Notes (Optional)
              </label>
              <textarea
                id="approvalNotes"
                className="form-input"
                rows="3"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes or comments about this approval"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveProperty}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Property Modal */}
      {showRejectModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Reject Property</h2>
            <p className="mb-4">
              Are you sure you want to reject the property with plot number <span className="font-semibold">{selectedProperty.plotNumber}</span>?
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
                    : 'bg-accent text-white hover:bg-accent-dark'
                }`}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyVerification;

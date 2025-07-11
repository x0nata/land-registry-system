import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getAllDocuments, verifyDocument, rejectDocument, downloadDocument, previewDocument } from '../../services/documentService';

const DocumentValidation = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Test to see if component loads
  console.log('DocumentValidation component loaded');

  // Fetch documents on component mount and when filters change
  useEffect(() => {
    fetchDocuments();
  }, [currentPage, statusFilter, typeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('Fetching documents...');

      const filters = {
        page: currentPage,
        limit,
        status: statusFilter || undefined,
        documentType: typeFilter || undefined,
        search: searchTerm || undefined
      };

      const response = await getAllDocuments(filters);
      console.log('Documents response:', response);

      setDocuments(response.documents || []);
      setTotalPages(response.totalPages || 1);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to fetch documents');
      setLoading(false);
      toast.error(err.message || 'Failed to fetch documents');

      // Set empty array as fallback
      setDocuments([]);
    }
  };

  const handleVerifyDocument = async (isVerified) => {
    try {
      if (isVerified) {
        await verifyDocument(selectedDocument._id, verificationNotes);
      } else {
        await rejectDocument(selectedDocument._id, verificationNotes);
      }

      setShowDocumentModal(false);
      setSelectedDocument(null);
      setVerificationNotes('');

      toast.success(`Document ${isVerified ? 'verified' : 'rejected'} successfully`);
      fetchDocuments();
    } catch (err) {
      toast.error(err.message || 'Failed to verify document');
    }
  };

  const handleDownloadDocument = async (documentId) => {
    console.log('DocumentValidation: Starting download for document ID:', documentId);

    try {
      // Use the downloadDocument service function
      await downloadDocument(documentId);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('DocumentValidation: Download error:', error);
      toast.error('Failed to download document: ' + error.message);
    }
  };

  const handlePreviewDocument = async (documentId) => {
    console.log('DocumentValidation: Starting preview for document ID:', documentId);

    try {
      // Use the previewDocument service function
      await previewDocument(documentId);
      toast.success('Document preview opened');
    } catch (error) {
      console.error('DocumentValidation: Preview error:', error);
      toast.error('Failed to preview document: ' + error.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDocuments();
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

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
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs_update':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Get status display text
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'needs_update':
        return 'Needs Update';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  // Get document type display name
  const getDocumentTypeDisplay = (type) => {
    switch (type) {
      case 'title_deed':
        return 'Title Deed';
      case 'id_copy':
        return 'ID Copy';
      case 'application_form':
        return 'Application Form';
      case 'tax_clearance':
        return 'Tax Clearance';
      case 'other':
        return 'Other';
      default:
        return type ? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
    }
  };

  // Simple test to ensure component renders
  if (loading && documents.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">Document Validation</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-4">Loading documents...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Document Validation</h1>
            <p className="text-gray-600">Verify and validate property documents</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center text-sm">
              <div className="flex items-center mr-4">
                <span className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></span>
                <span>Pending</span>
              </div>
              <div className="flex items-center mr-4">
                <span className="w-3 h-3 rounded-full bg-green-400 mr-1"></span>
                <span>Verified</span>
              </div>
              <div className="flex items-center mr-4">
                <span className="w-3 h-3 rounded-full bg-red-400 mr-1"></span>
                <span>Rejected</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-orange-400 mr-1"></span>
                <span>Needs Update</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-grow">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search by property or owner..."
                  className="form-input rounded-r-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
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
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="needs_update">Needs Update</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                className="form-input w-full"
                value={typeFilter}
                onChange={handleTypeFilterChange}
              >
                <option value="">All Types</option>
                <option value="title_deed">Title Deed</option>
                <option value="id_copy">ID Copy</option>
                <option value="application_form">Application Form</option>
                <option value="tax_clearance">Tax Clearance</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2">Loading documents...</p>
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
                      Document Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No documents found
                      </td>
                    </tr>
                  ) : (
                    documents.map((document) => (
                      <tr key={document._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getDocumentTypeDisplay(document.documentType)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {document.property?.plotNumber || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {document.property?.propertyType || 'Unknown'} property
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {document.owner?.fullName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {document.owner?.email || 'No email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(document.uploadDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(document.status)}`}>
                            {getStatusDisplay(document.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                console.log('Preview button clicked for document ID:', document._id);
                                handlePreviewDocument(document._id);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Preview Document"
                            >
                              <MagnifyingGlassIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                console.log('Download button clicked for document ID:', document._id);
                                console.log('Full document object:', document);
                                handleDownloadDocument(document._id);
                              }}
                              className="text-primary hover:text-primary-dark"
                              title="Download Document"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDocument(document);
                                setVerificationNotes(document.verificationNotes || '');
                                setShowDocumentModal(true);
                              }}
                              className="text-secondary hover:text-secondary-dark"
                              title={document.status === 'pending' ? "Verify Document" : "Update Verification"}
                            >
                              <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Showing page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Document Verification Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6">Document Verification</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Document Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">Document Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Document Type</p>
                    <p className="font-medium">{getDocumentTypeDisplay(selectedDocument.documentType)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Document Name</p>
                    <p className="font-medium">{selectedDocument.documentName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">File Type</p>
                    <p className="font-medium">{selectedDocument.fileType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">File Size</p>
                    <p className="font-medium">{selectedDocument.fileSize ? `${(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Upload Date</p>
                    <p className="font-medium">{formatDate(selectedDocument.uploadDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Status</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(selectedDocument.status)}`}>
                      {getStatusDisplay(selectedDocument.status)}
                    </span>
                  </div>
                </div>

                {/* Property and Owner Details */}
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-3">Property & Owner Details</h4>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Property Plot Number</p>
                      <p className="font-medium">{selectedDocument.property?.plotNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Property Type</p>
                      <p className="font-medium capitalize">{selectedDocument.property?.propertyType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Owner Name</p>
                      <p className="font-medium">{selectedDocument.owner?.fullName || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Owner Email</p>
                      <p className="font-medium">{selectedDocument.owner?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Access */}
              <div>
                <h3 className="text-lg font-medium mb-4">Document Access</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="text-center text-gray-500 py-8">
                    <DocumentMagnifyingGlassIcon className="h-12 w-12 mx-auto mb-2" />
                    <p className="mb-2">Preview or download the document to verify its contents</p>
                    <p className="text-sm mb-4">File Type: {selectedDocument.fileType || 'Unknown'}</p>

                    {/* Action buttons */}
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Modal preview button clicked for document ID:', selectedDocument._id);
                          handlePreviewDocument(selectedDocument._id);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                        Preview Document
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Modal download button clicked for document ID:', selectedDocument._id);
                          console.log('Selected document object:', selectedDocument);
                          handleDownloadDocument(selectedDocument._id);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Download Document
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Notes */}
            <div className="mt-6">
              <label htmlFor="verificationNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Notes
              </label>
              <textarea
                id="verificationNotes"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add notes about this verification (required for rejection)"
              ></textarea>
            </div>

            {/* Previous verification notes */}
            {selectedDocument.verificationNotes && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800">Previous Verification Notes:</p>
                <p className="text-sm text-yellow-700 mt-1">{selectedDocument.verificationNotes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowDocumentModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyDocument(false)}
                disabled={!verificationNotes.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                title={!verificationNotes.trim() ? "Notes required for rejection" : "Reject document"}
              >
                <XCircleIcon className="h-5 w-5 mr-1" />
                Reject
              </button>
              <button
                onClick={() => handleVerifyDocument(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <CheckCircleIcon className="h-5 w-5 mr-1" />
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentValidation;

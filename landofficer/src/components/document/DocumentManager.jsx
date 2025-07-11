import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { getPropertyDocuments, uploadDocument, updateDocument, deleteDocument, downloadDocument, previewDocument } from '../../services/documentService';
import DocumentUpload from './DocumentUpload';
import DocumentUpdateModal from './DocumentUpdateModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

const DocumentManager = ({ propertyId, onDocumentChange }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Load documents for the property
  useEffect(() => {
    if (propertyId) {
      loadDocuments();
    }
  }, [propertyId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      console.log('Loading documents for property ID:', propertyId);
      const docs = await getPropertyDocuments(propertyId);
      console.log('Documents loaded:', docs);
      console.log('Number of documents:', docs?.length || 0);

      // Log each document's details
      if (docs && docs.length > 0) {
        docs.forEach((doc, index) => {
          console.log(`Document ${index + 1}:`, {
            id: doc._id,
            name: doc.documentName,
            type: doc.documentType,
            status: doc.status,
            fileId: doc.fileId,
            filename: doc.filename,
            fileType: doc.fileType,
            fileSize: doc.fileSize
          });
        });
      } else {
        console.log('No documents found for this property');
      }

      setDocuments(docs || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    loadDocuments();
    if (onDocumentChange) {
      onDocumentChange();
    }
    toast.success('Document uploaded successfully');
  };

  const handleUpdateDocument = (document) => {
    setSelectedDocument(document);
    setShowUpdateModal(true);
  };

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    setSelectedDocument(null);
    loadDocuments();
    if (onDocumentChange) {
      onDocumentChange();
    }
    toast.success('Document updated successfully');
  };

  const handleDeleteDocument = (document) => {
    setSelectedDocument(document);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDocument(selectedDocument._id);
      setShowDeleteModal(false);
      setSelectedDocument(null);
      loadDocuments();
      if (onDocumentChange) {
        onDocumentChange();
      }
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDownloadDocument = async (document) => {
    console.log('DocumentManager: Starting download for document:', document);
    console.log('DocumentManager: Document ID:', document._id);

    try {
      // Use the downloadDocument service function
      await downloadDocument(document._id);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('DocumentManager: Download error:', error);
      toast.error('Failed to download document: ' + error.message);
    }
  };

  const handlePreviewDocument = async (document) => {
    console.log('DocumentManager: Starting preview for document:', document);
    console.log('DocumentManager: Document ID:', document._id);

    try {
      // Use the previewDocument service function
      await previewDocument(document._id);
      toast.success('Document preview opened');
    } catch (error) {
      console.error('DocumentManager: Preview error:', error);
      toast.error('Failed to preview document: ' + error.message);
    }
  };

  const getDocumentTypeDisplay = (type) => {
    switch (type) {
      case 'title_deed':
        return 'Title Deed';
      case 'id_copy':
        return 'National ID';
      case 'application_form':
        return 'Application Form';
      case 'tax_clearance':
        return 'Tax Clearance';
      case 'other':
        return 'Other Document';
      default:
        return type;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs_update':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Documents ({documents.length})
        </h3>
        {/* Only show upload button if no documents are approved */}
        {!documents.some(doc => doc.status === 'verified') && (
          <button
            onClick={() => setShowUpload(true)}
            className="bg-primary text-white px-3 py-2 rounded-md hover:bg-primary-dark flex items-center text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Upload Document
          </button>
        )}
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Documents Uploaded</h4>
          <p className="text-gray-500 mb-4">Upload your property documents to proceed with verification.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
          >
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((document) => (
            <div
              key={document._id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {getDocumentTypeDisplay(document.documentType)}
                  </h4>
                  <p className="text-sm text-gray-600">{document.documentName}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded: {formatDate(document.uploadDate)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(document.status)} capitalize`}>
                  {document.status.replace('_', ' ')}
                </span>
              </div>

              {/* Document Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handlePreviewDocument(document);
                    }}
                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleDownloadDocument(document);
                    }}
                    className="text-green-600 hover:text-green-800 flex items-center text-sm"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>

                {/* Action buttons for non-verified documents */}
                {['pending', 'rejected', 'needs_update'].includes(document.status) && (
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleUpdateDocument(document);
                      }}
                      className="text-yellow-600 hover:text-yellow-800 flex items-center text-sm"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Update
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleDeleteDocument(document);
                      }}
                      className="text-red-600 hover:text-red-800 flex items-center text-sm"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Verification Notes */}
              {document.verificationNotes && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium text-gray-700">Notes:</p>
                  <p className="text-gray-600">{document.verificationNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Document</h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <DocumentUpload
              propertyId={propertyId}
              onSuccess={handleUploadSuccess}
            />
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedDocument && (
        <DocumentUpdateModal
          document={selectedDocument}
          onSuccess={handleUpdateSuccess}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedDocument(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDocument && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedDocument(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Document"
          message={`Are you sure you want to delete "${selectedDocument.documentName}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
};

export default DocumentManager;

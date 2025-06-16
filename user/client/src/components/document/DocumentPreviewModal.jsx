import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PhotoIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { downloadDocument, previewDocument } from '../../services/documentService';

const DocumentPreviewModal = ({ document, isOpen, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewType, setPreviewType] = useState('');

  useEffect(() => {
    if (isOpen && document) {
      loadPreview();
    }
    return () => {
      // Cleanup preview URL when modal closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, document]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Loading preview for document:', document);

      // Determine preview type based on file type
      const fileType = document.fileType?.toLowerCase() || '';
      console.log('File type:', fileType);

      if (fileType.startsWith('image/')) {
        setPreviewType('image');
      } else if (fileType === 'application/pdf') {
        setPreviewType('pdf');
      } else if (fileType.includes('text/') || fileType.includes('document')) {
        setPreviewType('document');
      } else {
        setPreviewType('unsupported');
      }

      // Use the previewDocument service (same technique as download)
      const previewResult = await previewDocument(document._id);
      setPreviewUrl(previewResult.url);

    } catch (error) {
      console.error('Error loading preview:', error);
      setError('Failed to load document preview: ' + error.message);
      toast.error('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadDocument(document._id);
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentTypeDisplay = (type) => {
    switch (type) {
      case 'title_deed': return 'Title Deed';
      case 'id_copy': return 'National ID';
      case 'application_form': return 'Application Form';
      case 'tax_clearance': return 'Tax Clearance';
      case 'other': return 'Other Document';
      default: return type;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'needs_update': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600">Loading preview...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadPreview}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (previewType) {
      case 'image':
        return (
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
            <img
              src={previewUrl}
              alt={document.documentName}
              className="max-w-full max-h-96 object-contain rounded shadow-lg"
              onError={() => setError('Failed to load image preview')}
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="bg-gray-50 rounded-lg p-4">
            <iframe
              src={previewUrl}
              title={document.documentName}
              className="w-full h-96 border-0 rounded"
              onError={() => setError('Failed to load PDF preview')}
            />
          </div>
        );

      case 'document':
        return (
          <div className="bg-gray-50 rounded-lg p-4">
            <iframe
              src={previewUrl}
              title={document.documentName}
              className="w-full h-96 border-0 rounded"
              onError={() => setError('Failed to load document preview')}
            />
          </div>
        );

      case 'unsupported':
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h3>
            <p className="text-gray-600 mb-4">
              Preview is not supported for this file type ({document.fileType}).
            </p>
            <button
              onClick={handleDownload}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download to View
            </button>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {document.documentName}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{getDocumentTypeDisplay(document.documentType)}</span>
              <span>•</span>
              <span>{formatFileSize(document.fileSize)}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(document.status)}`}>
                {document.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 overflow-auto flex-1">
          {renderPreviewContent()}
        </div>

        {/* Action Buttons - Below Preview */}
        <div className="flex items-center justify-center p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;

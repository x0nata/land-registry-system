import { useState } from 'react';
import { 
  DocumentIcon, 
  DocumentTextIcon, 
  IdentificationIcon, 
  ReceiptRefundIcon, 
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const DocumentCard = ({ document, onView, onDownload, onUpdate, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  
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
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs_update':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get document type icon
  const getDocumentTypeIcon = (type) => {
    switch (type) {
      case 'title_deed':
        return <DocumentTextIcon className="w-8 h-8 text-blue-500" />;
      case 'id_copy':
        return <IdentificationIcon className="w-8 h-8 text-green-500" />;
      case 'application_form':
        return <DocumentIcon className="w-8 h-8 text-purple-500" />;
      case 'tax_clearance':
        return <ReceiptRefundIcon className="w-8 h-8 text-red-500" />;
      default:
        return <DocumentDuplicateIcon className="w-8 h-8 text-gray-500" />;
    }
  };
  
  // Get document type display name
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
      default:
        return 'Other Document';
    }
  };
  
  // Get file type display
  const getFileTypeDisplay = (fileType) => {
    if (fileType.startsWith('image/')) {
      return 'Image';
    } else if (fileType === 'application/pdf') {
      return 'PDF';
    } else if (fileType.includes('word')) {
      return 'Word Document';
    } else {
      return 'Document';
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };
  
  return (
    <div 
      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start">
        <div className="mr-4">
          {getDocumentTypeIcon(document.documentType)}
        </div>
        
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{document.documentName}</h4>
              <p className="text-gray-600 text-sm">
                {getDocumentTypeDisplay(document.documentType)}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(document.status)} capitalize`}>
              {document.status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            <p>Uploaded: {formatDate(document.uploadDate)}</p>
            <p>
              {getFileTypeDisplay(document.fileType)} • {formatFileSize(document.fileSize)}
            </p>
            {document.version > 1 && (
              <p className="text-ethiopian-yellow-dark">Version: {document.version}</p>
            )}
          </div>
          
          {document.status === 'rejected' && document.verificationNotes && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
              <p className="font-semibold">Rejection Reason:</p>
              <p>{document.verificationNotes}</p>
            </div>
          )}
          
          {document.status === 'needs_update' && document.verificationNotes && (
            <div className="mt-2 p-2 bg-orange-50 text-orange-700 text-sm rounded">
              <p className="font-semibold">Update Required:</p>
              <p>{document.verificationNotes}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      {showActions && (
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => onView(document)}
            className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 flex items-center"
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            View
          </button>
          
          <button
            onClick={() => onDownload(document)}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 flex items-center"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            Download
          </button>
          
          {['pending', 'rejected', 'needs_update'].includes(document.status) && (
            <>
              <button
                onClick={() => onUpdate(document)}
                className="text-sm bg-ethiopian-yellow text-gray-900 px-3 py-1 rounded hover:bg-opacity-90 flex items-center"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Update
              </button>
              
              <button
                onClick={() => onDelete(document)}
                className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 flex items-center"
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentCard;

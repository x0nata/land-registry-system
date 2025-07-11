import { useState } from 'react';
import { XMarkIcon, DocumentCheckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const DocumentReviewModal = ({ transfer, onClose, onSubmit }) => {
  const [documentReviews, setDocumentReviews] = useState(
    transfer.documents?.map(doc => ({
      documentId: doc._id,
      status: doc.verificationStatus || 'pending',
      notes: doc.verificationNotes || ''
    })) || []
  );

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(documentReviews);
    } catch (error) {
      console.error('Error submitting document reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentReview = (index, field, value) => {
    setDocumentReviews(prev => 
      prev.map((review, i) => 
        i === index ? { ...review, [field]: value } : review
      )
    );
  };

  const getDocumentTypeDisplay = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <DocumentCheckIcon className="h-6 w-6 text-primary mr-2" />
            <h3 className="text-lg font-semibold">Review Transfer Documents</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {transfer.documents && transfer.documents.length > 0 ? (
            <div className="space-y-4">
              {transfer.documents.map((document, index) => (
                <div key={document._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{document.documentName}</h4>
                      <p className="text-sm text-gray-500 capitalize">
                        {getDocumentTypeDisplay(document.documentType)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Uploaded: {formatDate(document.uploadDate)}
                      </p>
                      <p className="text-xs text-gray-400">
                        File: {document.filename} ({document.fileType})
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        document.verificationStatus === 'verified' 
                          ? 'bg-green-100 text-green-800'
                          : document.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {document.verificationStatus?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review Status
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`status-${index}`}
                            value="verified"
                            checked={documentReviews[index]?.status === 'verified'}
                            onChange={(e) => updateDocumentReview(index, 'status', e.target.value)}
                            className="mr-2"
                          />
                          <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm text-green-700">Verified</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`status-${index}`}
                            value="rejected"
                            checked={documentReviews[index]?.status === 'rejected'}
                            onChange={(e) => updateDocumentReview(index, 'status', e.target.value)}
                            className="mr-2"
                          />
                          <XCircleIcon className="h-4 w-4 text-red-600 mr-1" />
                          <span className="text-sm text-red-700">Rejected</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review Notes
                      </label>
                      <textarea
                        value={documentReviews[index]?.notes || ''}
                        onChange={(e) => updateDocumentReview(index, 'notes', e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                        placeholder={
                          documentReviews[index]?.status === 'rejected' 
                            ? 'Please provide reason for rejection...'
                            : 'Add verification notes (optional)...'
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No documents found for this transfer</p>
            </div>
          )}

          {/* Document Review Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h5 className="font-medium text-blue-900 mb-2">Document Review Guidelines:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Verify document authenticity and completeness</li>
              <li>• Check that all required information is present and legible</li>
              <li>• Ensure documents match the transfer type and parties involved</li>
              <li>• Validate signatures and official stamps where required</li>
              <li>• Confirm document dates are appropriate for the transfer timeline</li>
              <li>• Reject documents that are incomplete, illegible, or suspicious</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !transfer.documents?.length}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Document Reviews'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentReviewModal;

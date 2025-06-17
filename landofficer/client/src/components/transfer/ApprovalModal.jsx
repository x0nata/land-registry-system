import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ApprovalModal = ({ transfer, approvalType, onClose, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(approvalType, notes);
    } catch (error) {
      console.error('Error submitting approval:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTransferType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (amount, currency = 'ETB') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'ETB' ? 'USD' : currency,
      minimumFractionDigits: 0
    }).format(amount).replace('$', currency === 'ETB' ? 'ETB ' : '$');
  };

  const isApproval = approvalType === 'approved';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {isApproval ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
            ) : (
              <XCircleIcon className="h-6 w-6 text-red-600 mr-2" />
            )}
            <h3 className="text-lg font-semibold">
              {isApproval ? 'Approve Transfer' : 'Reject Transfer'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Transfer Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Transfer Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Property:</span>
              <span className="font-medium">Plot #{transfer.property?.plotNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transfer Type:</span>
              <span className="font-medium">{formatTransferType(transfer.transferType)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">From:</span>
              <span className="font-medium">{transfer.previousOwner?.fullName || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">To:</span>
              <span className="font-medium">{transfer.newOwner?.fullName || 'Unknown'}</span>
            </div>
            {transfer.transferValue?.amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Value:</span>
                <span className="font-medium">
                  {formatCurrency(transfer.transferValue.amount, transfer.transferValue.currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Warning/Confirmation Message */}
        <div className={`border rounded-lg p-4 mb-6 ${
          isApproval 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            {isApproval ? (
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            )}
            <div>
              <h5 className={`font-medium ${
                isApproval ? 'text-green-900' : 'text-red-900'
              }`}>
                {isApproval ? 'Confirm Transfer Approval' : 'Confirm Transfer Rejection'}
              </h5>
              <p className={`text-sm mt-1 ${
                isApproval ? 'text-green-800' : 'text-red-800'
              }`}>
                {isApproval 
                  ? 'By approving this transfer, you confirm that all documents have been verified, compliance checks have been completed, and the transfer meets all legal requirements. The transfer will proceed to the final completion stage.'
                  : 'By rejecting this transfer, you are preventing it from proceeding. Please provide a clear reason for rejection to help the applicants understand what needs to be corrected.'
                }
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isApproval ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              required={!isApproval}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
              placeholder={
                isApproval 
                  ? 'Add any additional notes about the approval...'
                  : 'Please provide a detailed reason for rejecting this transfer...'
              }
            />
            {!isApproval && (
              <p className="text-xs text-gray-500 mt-1">
                This reason will be shared with the transfer parties to help them understand what needs to be corrected.
              </p>
            )}
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
              disabled={loading || (!isApproval && !notes.trim())}
              className={`px-4 py-2 rounded-md text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                isApproval
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading 
                ? 'Processing...' 
                : isApproval 
                  ? 'Approve Transfer' 
                  : 'Reject Transfer'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalModal;

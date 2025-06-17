import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  HomeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentCheckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { getTransferById, reviewTransferDocuments, performComplianceChecks, approveTransfer } from '../../services/transferService';
import ComplianceCheckModal from '../../components/transfer/ComplianceCheckModal';
import DocumentReviewModal from '../../components/transfer/DocumentReviewModal';
import ApprovalModal from '../../components/transfer/ApprovalModal';

const TransferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalType, setApprovalType] = useState('approved');

  useEffect(() => {
    if (id) {
      fetchTransferDetails();
    }
  }, [id]);

  const fetchTransferDetails = async () => {
    try {
      setLoading(true);
      const data = await getTransferById(id);
      setTransfer(data.transfer);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch transfer details');
      toast.error(err.message || 'Failed to fetch transfer details');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentReview = async (documentReviews) => {
    try {
      await reviewTransferDocuments(id, documentReviews);
      toast.success('Documents reviewed successfully');
      setShowDocumentModal(false);
      fetchTransferDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to review documents');
    }
  };

  const handleComplianceCheck = async (complianceData) => {
    try {
      await performComplianceChecks(id, complianceData);
      toast.success('Compliance checks completed successfully');
      setShowComplianceModal(false);
      fetchTransferDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to perform compliance checks');
    }
  };

  const handleApproval = async (approvalStatus, notes) => {
    try {
      await approveTransfer(id, approvalStatus, notes);
      toast.success(`Transfer ${approvalStatus} successfully`);
      setShowApprovalModal(false);
      fetchTransferDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to process approval');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'under_review':
        return <DocumentCheckIcon className="h-6 w-6 text-blue-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'under_review':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'completed':
        return `${baseClasses} bg-green-200 text-green-900`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatTransferType = (type) => {
  if (!type) return 'N/A';
  return type.split('_').map(…)
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'ETB') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(amount).replace('$', currency === 'ETB' ? 'ETB ' : '$');
  };

  const canReviewDocuments = () => {
    return transfer?.status === 'pending' || transfer?.status === 'under_review';
  };

  const canPerformCompliance = () => {
    return transfer?.status === 'pending' || transfer?.status === 'under_review';
  };

  const canApprove = () => {
    return transfer?.status === 'under_review' || transfer?.status === 'pending';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || 'Transfer not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/landofficer/transfer-management')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Transfer Details</h1>
              <p className="text-gray-600">Review and process property transfer</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusIcon(transfer.status)}
            <span className={getStatusBadge(transfer.status)}>
              {transfer.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Property Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <HomeIcon className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold">Property Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Plot Number</label>
                <p className="mt-1 text-sm text-gray-900">{transfer.property?.plotNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Type</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {transfer.property?.propertyType || 'N/A'}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="mt-1 text-sm text-gray-900">{transfer.property?.location || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Transfer Parties */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <UserIcon className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold">Transfer Parties</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Previous Owner</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900">{transfer.previousOwner?.fullName || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{transfer.previousOwner?.email || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{transfer.previousOwner?.phoneNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-500">ID: {transfer.previousOwner?.nationalId || 'N/A'}</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">New Owner</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900">{transfer.newOwner?.fullName || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{transfer.newOwner?.email || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{transfer.newOwner?.phoneNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-500">ID: {transfer.newOwner?.nationalId || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold">Transfer Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transfer Type</label>
                <p className="mt-1 text-sm text-gray-900">{formatTransferType(transfer.transferType)}</p>
              </div>
              {transfer.transferValue?.amount > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer Value</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatCurrency(transfer.transferValue.amount, transfer.transferValue.currency)}
                  </p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Transfer Reason</label>
                <p className="mt-1 text-sm text-gray-900">{transfer.transferReason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Initiation Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(transfer.initiationDate)}</p>
              </div>
              {transfer.completionDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completion Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(transfer.completionDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          {transfer.documents && transfer.documents.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <DocumentCheckIcon className="h-6 w-6 text-primary mr-2" />
                  <h2 className="text-xl font-semibold">Transfer Documents</h2>
                </div>
                {canReviewDocuments() && (
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="btn-primary px-4 py-2 rounded-md text-sm"
                  >
                    Review Documents
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {transfer.documents.map((doc, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.documentName}</h4>
                        <p className="text-sm text-gray-500 capitalize">
                          {doc.documentType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-400">
                          Uploaded: {formatDate(doc.uploadDate)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          doc.verificationStatus === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : doc.verificationStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.verificationStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {doc.verificationNotes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        <strong>Review Notes:</strong> {doc.verificationNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Checks */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-6 w-6 text-primary mr-2" />
                <h2 className="text-xl font-semibold">Compliance Checks</h2>
              </div>
              {canPerformCompliance() && (
                <button
                  onClick={() => setShowComplianceModal(true)}
                  className="btn-primary px-4 py-2 rounded-md text-sm"
                >
                  Perform Checks
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Ethiopian Law Compliance */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Ethiopian Law Compliance</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    transfer.complianceChecks?.ethiopianLawCompliance?.checked
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {transfer.complianceChecks?.ethiopianLawCompliance?.checked ? 'CHECKED' : 'PENDING'}
                  </span>
                </div>
                {transfer.complianceChecks?.ethiopianLawCompliance?.checked && (
                  <div className="text-sm text-gray-600">
                    <p>Checked by: {transfer.complianceChecks.ethiopianLawCompliance.checkedBy?.fullName}</p>
                    <p>Date: {formatDate(transfer.complianceChecks.ethiopianLawCompliance.checkedDate)}</p>
                    {transfer.complianceChecks.ethiopianLawCompliance.notes && (
                      <p className="mt-1">Notes: {transfer.complianceChecks.ethiopianLawCompliance.notes}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Tax Clearance */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Tax Clearance</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    transfer.complianceChecks?.taxClearance?.checked
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {transfer.complianceChecks?.taxClearance?.checked ? 'CHECKED' : 'PENDING'}
                  </span>
                </div>
                {transfer.complianceChecks?.taxClearance?.checked && (
                  <div className="text-sm text-gray-600">
                    <p>Checked by: {transfer.complianceChecks.taxClearance.checkedBy?.fullName}</p>
                    <p>Date: {formatDate(transfer.complianceChecks.taxClearance.checkedDate)}</p>
                    {transfer.complianceChecks.taxClearance.notes && (
                      <p className="mt-1">Notes: {transfer.complianceChecks.taxClearance.notes}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Fraud Prevention */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Fraud Prevention</h4>
                  <div className="flex items-center space-x-2">
                    {transfer.complianceChecks?.fraudPrevention?.riskLevel && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transfer.complianceChecks.fraudPrevention.riskLevel === 'low'
                          ? 'bg-green-100 text-green-800'
                          : transfer.complianceChecks.fraudPrevention.riskLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transfer.complianceChecks.fraudPrevention.riskLevel.toUpperCase()} RISK
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      transfer.complianceChecks?.fraudPrevention?.checked
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {transfer.complianceChecks?.fraudPrevention?.checked ? 'CHECKED' : 'PENDING'}
                    </span>
                  </div>
                </div>
                {transfer.complianceChecks?.fraudPrevention?.checked && (
                  <div className="text-sm text-gray-600">
                    <p>Checked by: {transfer.complianceChecks.fraudPrevention.checkedBy?.fullName}</p>
                    <p>Date: {formatDate(transfer.complianceChecks.fraudPrevention.checkedDate)}</p>
                    {transfer.complianceChecks.fraudPrevention.notes && (
                      <p className="mt-1">Notes: {transfer.complianceChecks.fraudPrevention.notes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              {canApprove() && (
                <>
                  <button
                    onClick={() => {
                      setApprovalType('approved');
                      setShowApprovalModal(true);
                    }}
                    className="w-full btn-primary px-4 py-2 rounded-md flex items-center justify-center"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Approve Transfer
                  </button>
                  <button
                    onClick={() => {
                      setApprovalType('rejected');
                      setShowApprovalModal(true);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Reject Transfer
                  </button>
                </>
              )}

              {transfer.status === 'approved' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    Transfer has been approved and is ready for completion by an administrator.
                  </p>
                </div>
              )}

              {transfer.status === 'rejected' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    Transfer has been rejected and cannot proceed.
                  </p>
                </div>
              )}

              {transfer.status === 'completed' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    Transfer has been completed successfully.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Approvals */}
          {transfer.approvals && transfer.approvals.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Approvals</h3>
              <div className="space-y-3">
                {transfer.approvals.map((approval, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">
                        {approval.approverRole.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        approval.approvalStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : approval.approvalStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {approval.approvalStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {approval.approver?.fullName || 'Unknown'}
                    </p>
                    {approval.approvalDate && (
                      <p className="text-xs text-gray-400">
                        {formatDate(approval.approvalDate)}
                      </p>
                    )}
                    {approval.notes && (
                      <p className="text-xs text-gray-600 mt-1">
                        {approval.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {transfer.timeline && transfer.timeline.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Timeline</h3>
              <div className="space-y-3">
                {transfer.timeline.map((event, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.action}</p>
                      <p className="text-xs text-gray-500">
                        {event.performedBy?.fullName || 'System'} • {formatDate(event.timestamp)}
                      </p>
                      {event.notes && (
                        <p className="text-xs text-gray-600 mt-1">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showComplianceModal && (
        <ComplianceCheckModal
          transfer={transfer}
          onClose={() => setShowComplianceModal(false)}
          onSubmit={handleComplianceCheck}
        />
      )}

      {showDocumentModal && (
        <DocumentReviewModal
          transfer={transfer}
          onClose={() => setShowDocumentModal(false)}
          onSubmit={handleDocumentReview}
        />
      )}

      {showApprovalModal && (
        <ApprovalModal
          transfer={transfer}
          approvalType={approvalType}
          onClose={() => setShowApprovalModal(false)}
          onSubmit={handleApproval}
        />
      )}
    </div>
  );
};

export default TransferDetail;

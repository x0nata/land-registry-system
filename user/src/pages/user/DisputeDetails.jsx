import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ScaleIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import {
  getDisputeById,
  withdrawDispute,
  formatDisputeStatus,
  formatDisputeType,
  getDisputeStatusColor,
  getDisputeProgress,
  getNextExpectedAction,
  canWithdrawDispute,
  canAddEvidence
} from '../../services/disputeService';

const DisputeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  useEffect(() => {
    fetchDisputeDetails();
  }, [id]);

  const fetchDisputeDetails = async () => {
    try {
      setLoading(true);
      const response = await getDisputeById(id);
      setDispute(response);
    } catch (error) {
      console.error('Error fetching dispute details:', error);
      toast.error(error.message || 'Failed to fetch dispute details');
      navigate('/disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawReason.trim()) {
      toast.error('Please provide a reason for withdrawing the dispute');
      return;
    }

    try {
      await withdrawDispute(dispute._id, withdrawReason);
      toast.success('Dispute withdrawn successfully');
      setShowWithdrawModal(false);
      fetchDisputeDetails(); // Refresh the dispute details
    } catch (error) {
      console.error('Error withdrawing dispute:', error);
      toast.error(error.message || 'Failed to withdraw dispute');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'dismissed':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'withdrawn':
        return <XCircleIcon className="h-6 w-6 text-gray-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
    }
  };

  const formatLocation = (location) => {
    if (!location || typeof location !== 'object') return 'N/A';
    
    const parts = [];
    if (location.kebele) parts.push(location.kebele);
    if (location.subCity) parts.push(location.subCity);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Dispute not found</h3>
          <p className="mt-1 text-sm text-gray-500">The dispute you're looking for doesn't exist.</p>
          <div className="mt-6">
            <Link
              to="/disputes"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Disputes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/disputes')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to My Disputes
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ScaleIcon className="h-8 w-8 mr-2 text-blue-600" />
            Dispute Details
          </h1>
          {canWithdrawDispute(dispute) && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Withdraw Dispute
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {getStatusIcon(dispute.status)}
                <div className="ml-3">
                  <h2 className="text-xl font-semibold text-gray-900">{dispute.title}</h2>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDisputeStatusColor(dispute.status)}`}>
                    {formatDisputeStatus(dispute.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{getDisputeProgress(dispute.status)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    dispute.status === 'resolved' ? 'bg-green-500' :
                    dispute.status === 'dismissed' || dispute.status === 'withdrawn' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${getDisputeProgress(dispute.status)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Next:</strong> {getNextExpectedAction(dispute)}
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
            </div>
          </div>

          {/* Timeline */}
          {dispute.timeline && dispute.timeline.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Timeline
              </h3>
              <div className="space-y-4">
                {dispute.timeline.map((event, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{event.action}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.timestamp || event.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {event.notes && (
                        <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                      )}
                      {event.performedByRole && (
                        <p className="text-xs text-gray-500 mt-1">
                          By: {event.performedByRole}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Details */}
          {dispute.resolution && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                Resolution
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Decision: </span>
                  <span className="text-sm text-gray-900">{dispute.resolution.decision}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Resolution Notes: </span>
                  <p className="text-sm text-gray-900 mt-1">{dispute.resolution.resolutionNotes}</p>
                </div>
                {dispute.resolution.actionRequired && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Action Required: </span>
                    <p className="text-sm text-gray-900 mt-1">{dispute.resolution.actionRequired}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-700">Resolved Date: </span>
                  <span className="text-sm text-gray-900">
                    {new Date(dispute.resolution.resolutionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <HomeIcon className="h-5 w-5 mr-2" />
              Property Information
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Plot Number: </span>
                <span className="text-sm text-gray-900">{dispute.property?.plotNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Location: </span>
                <span className="text-sm text-gray-900">{formatLocation(dispute.property?.location)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Property Type: </span>
                <span className="text-sm text-gray-900">{dispute.property?.propertyType || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Dispute Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Dispute Information
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Type: </span>
                <span className="text-sm text-gray-900">{formatDisputeType(dispute.disputeType)}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Submitted: </span>
                <span className="text-sm text-gray-900">
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </span>
              </div>
              {dispute.assignedTo && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Assigned To: </span>
                  <span className="text-sm text-gray-900">{dispute.assignedTo.fullName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {canAddEvidence(dispute) && (
                <button
                  onClick={() => toast.info('Evidence upload functionality coming soon')}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Evidence
                </button>
              )}
              <Link
                to="/disputes"
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-center block"
              >
                Back to All Disputes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Withdraw Dispute
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to withdraw this dispute? This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for withdrawal
                </label>
                <textarea
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide a reason for withdrawing this dispute..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Withdraw Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeDetails;

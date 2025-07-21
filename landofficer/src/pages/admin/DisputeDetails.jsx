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
  ChatBubbleLeftRightIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import {
  getDisputeById,
  updateDisputeStatus,
  resolveDispute,
  assignDispute,
  formatDisputeStatus,
  formatDisputeType,
  getDisputeStatusColor,
  getDisputePriority,
  getPriorityColor
} from '../../services/disputeService';
import { getAllUsers } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const DisputeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dispute, setDispute] = useState(null);
  const [landOfficers, setLandOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Form states
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  const [resolution, setResolution] = useState({ decision: '', resolutionNotes: '', actionRequired: '' });
  const [assignment, setAssignment] = useState({ assignedTo: '', notes: '' });

  useEffect(() => {
    fetchDisputeDetails();
    if (user?.role === 'admin') {
      fetchLandOfficers();
    }
  }, [id]);

  const fetchDisputeDetails = async () => {
    try {
      setLoading(true);
      const response = await getDisputeById(id);
      setDispute(response);
    } catch (error) {
      console.error('Error fetching dispute details:', error);
      toast.error(error.message || 'Failed to fetch dispute details');
      navigate('/admin/disputes');
    } finally {
      setLoading(false);
    }
  };

  const fetchLandOfficers = async () => {
    try {
      const response = await getAllUsers({ role: 'landOfficer', limit: 100 });
      setLandOfficers(response.users || []);
    } catch (error) {
      console.error('Error fetching land officers:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate.status || !statusUpdate.notes.trim()) {
      toast.error('Status and notes are required');
      return;
    }

    try {
      await updateDisputeStatus(dispute._id, statusUpdate);
      toast.success('Dispute status updated successfully');
      setShowStatusModal(false);
      setStatusUpdate({ status: '', notes: '' });
      fetchDisputeDetails();
    } catch (error) {
      console.error('Error updating dispute status:', error);
      toast.error(error.message || 'Failed to update dispute status');
    }
  };

  const handleResolveDispute = async () => {
    if (!resolution.decision || !resolution.resolutionNotes.trim()) {
      toast.error('Decision and resolution notes are required');
      return;
    }

    try {
      await resolveDispute(dispute._id, resolution);
      toast.success('Dispute resolved successfully');
      setShowResolveModal(false);
      setResolution({ decision: '', resolutionNotes: '', actionRequired: '' });
      fetchDisputeDetails();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error(error.message || 'Failed to resolve dispute');
    }
  };

  const handleAssignDispute = async () => {
    if (!assignment.assignedTo) {
      toast.error('Please select a land officer to assign');
      return;
    }

    try {
      await assignDispute(dispute._id, assignment);
      toast.success('Dispute assigned successfully');
      setShowAssignModal(false);
      setAssignment({ assignedTo: '', notes: '' });
      fetchDisputeDetails();
    } catch (error) {
      console.error('Error assigning dispute:', error);
      toast.error(error.message || 'Failed to assign dispute');
    }
  };

  const formatLocation = (location) => {
    if (!location || typeof location !== 'object') return 'N/A';
    
    const parts = [];
    if (location.kebele) parts.push(location.kebele);
    if (location.subCity) parts.push(location.subCity);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
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
              to="/admin/disputes"
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

  const priority = getDisputePriority(dispute);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/disputes')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to All Disputes
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ScaleIcon className="h-8 w-8 mr-2 text-blue-600" />
            Dispute Management
          </h1>
          <div className="flex space-x-3">
            {dispute.status !== 'resolved' && dispute.status !== 'dismissed' && (
              <>
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Update Status
                </button>
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Resolve
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Assign
                  </button>
                )}
              </>
            )}
          </div>
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
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDisputeStatusColor(dispute.status)}`}>
                      {formatDisputeStatus(dispute.status)}
                    </span>
                    <span className={`text-sm font-medium ${getPriorityColor(priority)}`}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                    </span>
                  </div>
                </div>
              </div>
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
                  <span className="text-sm font-medium text-gray-700">Resolved By: </span>
                  <span className="text-sm text-gray-900">{dispute.resolution.resolvedBy?.fullName || 'N/A'}</span>
                </div>
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

          {/* Disputant Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Disputant Information
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Name: </span>
                <span className="text-sm text-gray-900">{dispute.disputant?.fullName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Email: </span>
                <span className="text-sm text-gray-900">{dispute.disputant?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Phone: </span>
                <span className="text-sm text-gray-900">{dispute.disputant?.phoneNumber || 'N/A'}</span>
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
              {dispute.assignedDate && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Assigned Date: </span>
                  <span className="text-sm text-gray-900">
                    {new Date(dispute.assignedDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update Dispute Status
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="under_review">Under Review</option>
                  <option value="investigation">Investigation</option>
                  <option value="mediation">Mediation</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notes about the status update..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusUpdate({ status: '', notes: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Resolve Dispute
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision
                </label>
                <select
                  value={resolution.decision}
                  onChange={(e) => setResolution({ ...resolution, decision: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select decision</option>
                  <option value="in_favor_of_disputant">In Favor of Disputant</option>
                  <option value="in_favor_of_respondent">In Favor of Respondent</option>
                  <option value="compromise">Compromise</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={resolution.resolutionNotes}
                  onChange={(e) => setResolution({ ...resolution, resolutionNotes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter detailed resolution notes..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Required (Optional)
                </label>
                <textarea
                  value={resolution.actionRequired}
                  onChange={(e) => setResolution({ ...resolution, actionRequired: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any follow-up actions required..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setResolution({ decision: '', resolutionNotes: '', actionRequired: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveDispute}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Resolve Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Dispute Modal */}
      {showAssignModal && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Dispute
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Land Officer
                </label>
                <select
                  value={assignment.assignedTo}
                  onChange={(e) => setAssignment({ ...assignment, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select land officer</option>
                  {landOfficers.map((officer) => (
                    <option key={officer._id} value={officer._id}>
                      {officer.fullName} ({officer.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={assignment.notes}
                  onChange={(e) => setAssignment({ ...assignment, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any specific instructions for the assigned officer..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssignment({ assignedTo: '', notes: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDispute}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  Assign Dispute
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

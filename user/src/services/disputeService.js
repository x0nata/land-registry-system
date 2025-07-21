import api from './api';

// Submit a new dispute
export const submitDispute = async (disputeData) => {
  try {
    const response = await api.post('/disputes', disputeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit dispute' };
  }
};

// Get user's disputes
export const getUserDisputes = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/disputes/my-disputes?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch disputes' };
  }
};

// Get dispute by ID
export const getDisputeById = async (disputeId) => {
  try {
    const response = await api.get(`/disputes/${disputeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch dispute' };
  }
};

// Withdraw a dispute
export const withdrawDispute = async (disputeId, reason) => {
  try {
    const response = await api.put(`/disputes/${disputeId}/withdraw`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to withdraw dispute' };
  }
};

// Add evidence to dispute
export const addEvidence = async (disputeId, evidenceData) => {
  try {
    const response = await api.post(`/disputes/${disputeId}/evidence`, evidenceData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to add evidence' };
  }
};

// Helper function to format dispute status for display
export const formatDisputeStatus = (status) => {
  const statusMap = {
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'investigation': 'Investigation',
    'mediation': 'Mediation',
    'resolved': 'Resolved',
    'dismissed': 'Dismissed',
    'withdrawn': 'Withdrawn'
  };
  return statusMap[status] || status;
};

// Helper function to format dispute type for display
export const formatDisputeType = (type) => {
  const typeMap = {
    'ownership_dispute': 'Ownership Dispute',
    'boundary_dispute': 'Boundary Dispute',
    'documentation_error': 'Documentation Error',
    'fraudulent_registration': 'Fraudulent Registration',
    'inheritance_dispute': 'Inheritance Dispute',
    'other': 'Other'
  };
  return typeMap[type] || type;
};

// Helper function to get status color for UI
export const getDisputeStatusColor = (status) => {
  const colorMap = {
    'submitted': 'bg-blue-100 text-blue-800',
    'under_review': 'bg-yellow-100 text-yellow-800',
    'investigation': 'bg-orange-100 text-orange-800',
    'mediation': 'bg-purple-100 text-purple-800',
    'resolved': 'bg-green-100 text-green-800',
    'dismissed': 'bg-red-100 text-red-800',
    'withdrawn': 'bg-gray-100 text-gray-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// Helper function to get status icon
export const getDisputeStatusIcon = (status) => {
  const iconMap = {
    'submitted': '📝',
    'under_review': '👀',
    'investigation': '🔍',
    'mediation': '⚖️',
    'resolved': '✅',
    'dismissed': '❌',
    'withdrawn': '↩️'
  };
  return iconMap[status] || '📄';
};

// Helper function to check if dispute can be withdrawn
export const canWithdrawDispute = (dispute) => {
  const withdrawableStatuses = ['submitted', 'under_review', 'investigation'];
  return withdrawableStatuses.includes(dispute.status);
};

// Helper function to check if evidence can be added
export const canAddEvidence = (dispute) => {
  const evidenceAllowedStatuses = ['submitted', 'under_review', 'investigation', 'mediation'];
  return evidenceAllowedStatuses.includes(dispute.status);
};

// Helper function to get dispute progress percentage
export const getDisputeProgress = (status) => {
  const progressMap = {
    'submitted': 20,
    'under_review': 40,
    'investigation': 60,
    'mediation': 80,
    'resolved': 100,
    'dismissed': 100,
    'withdrawn': 0
  };
  return progressMap[status] || 0;
};

// Helper function to get next expected action
export const getNextExpectedAction = (dispute) => {
  const actionMap = {
    'submitted': 'Waiting for initial review by land office',
    'under_review': 'Under review by land officer',
    'investigation': 'Investigation in progress',
    'mediation': 'Mediation process ongoing',
    'resolved': 'Dispute has been resolved',
    'dismissed': 'Dispute has been dismissed',
    'withdrawn': 'Dispute has been withdrawn'
  };
  return actionMap[dispute.status] || 'Status update pending';
};

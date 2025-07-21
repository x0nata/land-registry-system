import api from './api';

// Get all disputes (Admin/Land Officer)
export const getAllDisputes = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      disputeType = 'all',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (status !== 'all') {
      queryParams.append('status', status);
    }

    if (disputeType !== 'all') {
      queryParams.append('disputeType', disputeType);
    }

    if (search.trim()) {
      queryParams.append('search', search.trim());
    }

    const response = await api.get(`/disputes/admin/all?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch disputes' };
  }
};

// Get dispute by ID (Admin/Land Officer)
export const getDisputeById = async (disputeId) => {
  try {
    const response = await api.get(`/disputes/admin/${disputeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch dispute details' };
  }
};

// Update dispute status (Admin/Land Officer)
export const updateDisputeStatus = async (disputeId, statusData) => {
  try {
    const response = await api.put(`/disputes/admin/${disputeId}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update dispute status' };
  }
};

// Resolve dispute (Admin/Land Officer)
export const resolveDispute = async (disputeId, resolutionData) => {
  try {
    const response = await api.put(`/disputes/admin/${disputeId}/resolve`, resolutionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to resolve dispute' };
  }
};

// Assign dispute to land officer (Admin only)
export const assignDispute = async (disputeId, assignmentData) => {
  try {
    const response = await api.put(`/disputes/admin/${disputeId}/assign`, assignmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to assign dispute' };
  }
};

// Get dispute statistics for dashboard
export const getDisputeStats = async () => {
  try {
    const response = await getAllDisputes({ limit: 1000 }); // Get all for stats
    const disputes = response.disputes || [];
    
    const stats = {
      total: disputes.length,
      submitted: disputes.filter(d => d.status === 'submitted').length,
      underReview: disputes.filter(d => d.status === 'under_review').length,
      investigation: disputes.filter(d => d.status === 'investigation').length,
      mediation: disputes.filter(d => d.status === 'mediation').length,
      resolved: disputes.filter(d => d.status === 'resolved').length,
      dismissed: disputes.filter(d => d.status === 'dismissed').length,
      withdrawn: disputes.filter(d => d.status === 'withdrawn').length,
      byType: {
        ownership_dispute: disputes.filter(d => d.disputeType === 'ownership_dispute').length,
        boundary_dispute: disputes.filter(d => d.disputeType === 'boundary_dispute').length,
        documentation_error: disputes.filter(d => d.disputeType === 'documentation_error').length,
        fraudulent_registration: disputes.filter(d => d.disputeType === 'fraudulent_registration').length,
        inheritance_dispute: disputes.filter(d => d.disputeType === 'inheritance_dispute').length,
        other: disputes.filter(d => d.disputeType === 'other').length,
      }
    };

    return stats;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch dispute statistics' };
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

// Helper function to get priority level based on dispute type and age
export const getDisputePriority = (dispute) => {
  const createdDate = new Date(dispute.createdAt);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // High priority dispute types
  const highPriorityTypes = ['fraudulent_registration', 'ownership_dispute'];
  
  if (highPriorityTypes.includes(dispute.disputeType)) {
    return 'high';
  }
  
  // Age-based priority
  if (daysSinceCreated > 30) {
    return 'high';
  } else if (daysSinceCreated > 14) {
    return 'medium';
  }
  
  return 'low';
};

// Helper function to get priority color
export const getPriorityColor = (priority) => {
  const colorMap = {
    'high': 'text-red-600',
    'medium': 'text-yellow-600',
    'low': 'text-green-600'
  };
  return colorMap[priority] || 'text-gray-600';
};

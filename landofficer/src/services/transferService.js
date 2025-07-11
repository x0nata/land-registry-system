import api from './api';

// Get all transfers for land officer review
export const getAllTransfers = async (page = 1, limit = 10, status = '', transferType = '') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) params.append('status', status);
    if (transferType) params.append('transferType', transferType);
    
    const response = await api.get(`/transfers?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch transfers' };
  }
};

// Get transfer by ID with full details
export const getTransferById = async (transferId) => {
  try {
    const response = await api.get(`/transfers/${transferId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch transfer details' };
  }
};

// Review transfer documents
export const reviewTransferDocuments = async (transferId, documentReviews) => {
  try {
    const response = await api.put(`/transfers/${transferId}/review-documents`, {
      documentReviews
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to review transfer documents' };
  }
};

// Perform compliance checks
export const performComplianceChecks = async (transferId, complianceData) => {
  try {
    const response = await api.put(`/transfers/${transferId}/compliance`, complianceData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to perform compliance checks' };
  }
};

// Approve or reject transfer
export const approveTransfer = async (transferId, approvalStatus, notes = '') => {
  try {
    const response = await api.put(`/transfers/${transferId}/approve`, {
      approvalStatus,
      notes
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to process transfer approval' };
  }
};

// Complete transfer (admin only)
export const completeTransfer = async (transferId) => {
  try {
    const response = await api.put(`/transfers/${transferId}/complete`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to complete transfer' };
  }
};

// Get transfer statistics for dashboard
export const getTransferStats = async () => {
  try {
    const response = await api.get('/transfers/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch transfer statistics' };
  }
};

// Search transfers
export const searchTransfers = async (query, filters = {}) => {
  try {
    const params = new URLSearchParams({
      q: query,
      ...filters
    });
    
    const response = await api.get(`/transfers/search?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search transfers' };
  }
};

// Get pending transfers requiring action
export const getPendingTransfers = async () => {
  try {
    const response = await api.get('/transfers?status=pending');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch pending transfers' };
  }
};

// Export transfer data
export const exportTransferData = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/transfers/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transfers-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { message: 'Transfer data exported successfully' };
  } catch (error) {
    throw error.response?.data || { message: 'Failed to export transfer data' };
  }
};

import api, { dashboardApi, fastApi } from './api';

// Get all properties for the current user
export const getUserProperties = async () => {
  try {
    const response = await api.get('/properties/user');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch properties' };
  }
};

// Get properties assigned to the current land officer
export const getAssignedProperties = async (filters = {}) => {
  try {
    const response = await api.get('/properties/assigned', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch assigned properties' };
  }
};

// Get a single property by ID
export const getPropertyById = async (propertyId) => {
  try {
    const response = await api.get(`/properties/${propertyId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch property' };
  }
};

// Register a new property
export const registerProperty = async (propertyData) => {
  try {
    const response = await api.post('/properties', propertyData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to register property' };
  }
};

// Update a property
export const updateProperty = async (propertyId, propertyData) => {
  try {
    const response = await api.put(`/properties/${propertyId}`, propertyData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update property' };
  }
};

// Delete a property
export const deleteProperty = async (propertyId) => {
  try {
    const response = await api.delete(`/properties/${propertyId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete property' };
  }
};

// Get all properties (admin/land officer only)
export const getAllProperties = async (filters = {}) => {
  try {
    const response = await api.get('/properties', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch properties' };
  }
};

// Get pending properties for review (land officer only)
export const getPendingProperties = async (params = {}) => {
  try {
    // Use dashboard API for better timeout handling when called from dashboard
    const apiInstance = params.dashboard ? dashboardApi : api;
    const response = await apiInstance.get('/properties/pending', { params });
    return response.data;
  } catch (error) {
    // Enhanced error handling for timeout issues
    if (error.code === 'ECONNABORTED' || error.isRetryExhausted) {
      throw {
        message: 'Request timed out. The server may be experiencing high load. Please try again.',
        isTimeout: true,
        originalError: error
      };
    }
    throw error.response?.data || { message: 'Failed to fetch pending properties' };
  }
};

// Approve a property (land officer/admin only)
export const approveProperty = async (propertyId, notes) => {
  try {
    const response = await api.put(`/properties/${propertyId}/approve`, { notes });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to approve property' };
  }
};

// Reject a property (land officer/admin only)
export const rejectProperty = async (propertyId, reason) => {
  try {
    const response = await api.put(`/properties/${propertyId}/reject`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to reject property' };
  }
};

// Request additional documents for a property (land officer/admin only)
export const requestDocuments = async (propertyId, documentTypes, message) => {
  try {
    const response = await api.post(`/properties/${propertyId}/request-documents`, {
      documentTypes,
      message
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to request documents' };
  }
};

// Verify a document (land officer/admin only)
export const verifyDocument = async (propertyId, documentId, isVerified, notes) => {
  try {
    const response = await api.put(`/properties/${propertyId}/documents/${documentId}/verify`, {
      verified: isVerified,
      notes
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to verify document' };
  }
};

// Get property transfer history (land officer/admin only)
export const getPropertyTransferHistory = async (propertyId) => {
  try {
    const response = await api.get(`/properties/${propertyId}/transfers`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch property transfer history' };
  }
};

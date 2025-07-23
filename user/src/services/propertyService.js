import api from './api';

// Get all properties for the current user
export const getUserProperties = async () => {
  try {
    console.log('Fetching user properties...');
    const response = await api.get('/properties/user');
    console.log('Properties API response:', response.data);

    // Extract properties array from the response object
    if (response.data && response.data.success && Array.isArray(response.data.properties)) {
      console.log(`Successfully fetched ${response.data.properties.length} properties`);
      return response.data.properties;
    }

    // Fallback for different response structures
    const properties = Array.isArray(response.data) ? response.data : [];
    console.log(`Fallback: returning ${properties.length} properties`);
    return properties;
  } catch (error) {
    console.error('Error in getUserProperties:', error);

    // Enhanced error handling
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);

      // Handle specific error cases
      if (error.response.status === 401) {
        throw { message: 'Authentication required. Please log in again.', code: 'AUTH_REQUIRED' };
      } else if (error.response.status === 500) {
        throw { message: 'Server error. Please try again later.', code: 'SERVER_ERROR' };
      }

      throw error.response.data || { message: 'Failed to fetch properties' };
    } else if (error.request) {
      console.error('Network Error:', error.request);
      throw { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR' };
    } else {
      console.error('Unknown Error:', error.message);
      throw { message: error.message || 'Failed to fetch properties', code: 'UNKNOWN_ERROR' };
    }
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
export const getPendingProperties = async () => {
  try {
    const response = await api.get('/properties/pending');
    return response.data;
  } catch (error) {
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

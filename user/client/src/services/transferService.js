import api from './api';

// Initiate property transfer
export const initiateTransfer = async (transferData) => {
  try {
    const response = await api.post('/transfers', transferData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to initiate transfer' };
  }
};

// Get user's transfers
export const getUserTransfers = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/transfers/my-transfers?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch transfers' };
  }
};

// Get transfer by ID
export const getTransferById = async (transferId) => {
  try {
    const response = await api.get(`/transfers/${transferId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch transfer' };
  }
};

// Cancel a transfer
export const cancelTransfer = async (transferId, reason) => {
  try {
    const response = await api.put(`/transfers/${transferId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to cancel transfer' };
  }
};

// Upload transfer documents
export const uploadTransferDocuments = async (transferId, documents) => {
  try {
    const response = await api.post(`/transfers/${transferId}/documents`, { documents });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to upload transfer documents' };
  }
};

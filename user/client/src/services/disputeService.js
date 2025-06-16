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

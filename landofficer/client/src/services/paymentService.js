import api from './api';

// Create a new payment for a property
export const createPayment = async (propertyId, paymentData) => {
  try {
    const response = await api.post(`/payments/property/${propertyId}`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create payment' };
  }
};

// Get all payments for a property
export const getPropertyPayments = async (propertyId) => {
  try {
    const response = await api.get(`/payments/property/${propertyId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch payments' };
  }
};

// Get all payments for the current user
export const getUserPayments = async () => {
  try {
    const response = await api.get('/payments/user');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch payments' };
  }
};

// Get a single payment by ID
export const getPaymentById = async (paymentId) => {
  try {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch payment' };
  }
};

// Update payment status (e.g., after successful payment)
export const updatePaymentStatus = async (paymentId, status, transactionId) => {
  try {
    const response = await api.put(`/payments/${paymentId}/status`, {
      status,
      transactionId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update payment status' };
  }
};

// Upload payment receipt
export const uploadPaymentReceipt = async (paymentId, file) => {
  try {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await api.post(`/payments/${paymentId}/receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to upload payment receipt' };
  }
};

// Get all pending payments (admin/land officer only)
export const getPendingPayments = async () => {
  try {
    const response = await api.get('/payments/pending');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch pending payments' };
  }
};

// Verify a payment (admin/land officer only)
export const verifyPayment = async (paymentId, notes) => {
  try {
    const response = await api.put(`/payments/${paymentId}/verify`, { notes });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to verify payment' };
  }
};

// Reject a payment (admin/land officer only)
export const rejectPayment = async (paymentId, reason) => {
  try {
    const response = await api.put(`/payments/${paymentId}/reject`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to reject payment' };
  }
};

// Get all payments (admin/land officer only)
export const getAllPayments = async (filters = {}) => {
  try {
    const response = await api.get('/payments', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch payments' };
  }
};

// Download payment receipt
export const downloadReceipt = async (paymentId) => {
  try {
    const response = await api.get(`/payments/${paymentId}/receipt`, {
      responseType: 'blob'
    });

    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Get the filename from the Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = `receipt-${paymentId}.pdf`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return true;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to download receipt' };
  }
};

// Generate payment invoice
export const generateInvoice = async (paymentId) => {
  try {
    const response = await api.get(`/payments/${paymentId}/invoice`, {
      responseType: 'blob'
    });

    // Create a URL for the blob and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${paymentId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  } catch (error) {
    throw error.response?.data || { message: 'Failed to generate invoice' };
  }
};

// Chapa Payment Services

// Initialize Chapa payment for a property
export const initializeChapaPayment = async (propertyId, returnUrl) => {
  try {
    const response = await api.post(`/payments/chapa/initialize/${propertyId}`, { returnUrl });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to initialize payment' };
  }
};

// Verify Chapa payment status
export const verifyChapaPayment = async (txRef) => {
  try {
    const response = await api.get(`/payments/chapa/verify/${txRef}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to verify payment' };
  }
};

import api, { dashboardApi, fastApi } from './api';

// Get property statistics
export const getPropertyStats = async (filters = {}) => {
  try {
    // Use fast API for stats to improve dashboard loading performance
    const apiInstance = filters.dashboard ? fastApi : api;

    // Clean up params to avoid sending undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
    );

    console.log('📊 Fetching property stats with params:', cleanParams);

    const response = await apiInstance.get('/reports/properties', { params: cleanParams });

    console.log('✅ Successfully fetched property stats');

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching property statistics:', error);

    // Enhanced error handling
    if (error.code === 'ECONNABORTED' || error.isRetryExhausted) {
      throw {
        message: 'Request timed out while fetching property statistics. Please try again.',
        isTimeout: true,
        originalError: error
      };
    }

    if (error.response?.status === 500) {
      throw {
        message: 'Server error while fetching property statistics. Please try again in a moment.',
        isServerError: true,
        originalError: error
      };
    }

    throw error.response?.data || { message: 'Failed to fetch property statistics' };
  }
};

// Get user statistics
export const getUserStats = async (filters = {}) => {
  try {
    const response = await api.get('/reports/users', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user statistics' };
  }
};

// Get document statistics
export const getDocumentStats = async (filters = {}) => {
  try {
    // Use fast API for stats to improve dashboard loading performance
    const apiInstance = filters.dashboard ? fastApi : api;

    // Clean up params to avoid sending undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
    );

    console.log('📋 Fetching document stats with params:', cleanParams);

    const response = await apiInstance.get('/reports/documents', { params: cleanParams });

    console.log('✅ Successfully fetched document stats');

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching document statistics:', error);

    // Enhanced error handling
    if (error.code === 'ECONNABORTED' || error.isRetryExhausted) {
      throw {
        message: 'Request timed out while fetching document statistics. Please try again.',
        isTimeout: true,
        originalError: error
      };
    }

    if (error.response?.status === 500) {
      throw {
        message: 'Server error while fetching document statistics. Please try again in a moment.',
        isServerError: true,
        originalError: error
      };
    }

    throw error.response?.data || { message: 'Failed to fetch document statistics' };
  }
};

// Get payment statistics
export const getPaymentStats = async (filters = {}) => {
  try {
    const response = await api.get('/reports/payments', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch payment statistics' };
  }
};

// Generate application statistics report
export const generateApplicationReport = async (filters = {}) => {
  try {
    const response = await api.get('/reports/applications', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to generate application report' };
  }
};

// Generate summary report
export const generateSummaryReport = async (filters = {}) => {
  try {
    const response = await api.get('/reports/summary', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to generate summary report' };
  }
};

// Download report as PDF/Excel
export const downloadReport = async (reportType, format = 'pdf', filters = {}) => {
  try {
    const response = await api.get(`/reports/${reportType}/download`, {
      params: { format, ...filters },
      responseType: 'blob'
    });

    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Get the filename from the Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = `${reportType}-report.${format}`;

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
    throw error.response?.data || { message: 'Failed to download report' };
  }
};

// Get activity logs for reports
export const getActivityLogs = async (filters = {}) => {
  try {
    const response = await api.get('/reports/activity', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch activity logs' };
  }
};

// Get performance metrics
export const getPerformanceMetrics = async (filters = {}) => {
  try {
    const response = await api.get('/reports/performance', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch performance metrics' };
  }
};

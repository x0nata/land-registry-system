import api, { dashboardApi, recentActivitiesApi } from './api';

// Get application logs for a property
export const getPropertyLogs = async (propertyId) => {
  try {
    const response = await api.get(`/logs/property/${propertyId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch property logs' };
  }
};

// Get application logs for the current user
export const getUserLogs = async () => {
  try {
    const response = await api.get('/logs/user');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user logs' };
  }
};

// Get all application logs (admin only)
export const getAllLogs = async (filters = {}) => {
  try {
    const response = await api.get('/logs', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch logs' };
  }
};

// Add a comment to a property application
export const addComment = async (propertyId, comment) => {
  try {
    const response = await api.post(`/logs/property/${propertyId}/comment`, { comment });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to add comment' };
  }
};

// Get recent activities (admin/land officer only)
export const getRecentActivities = async (params = {}) => {
  try {
    // Use specialized recent activities API for better timeout handling with large datasets
    const apiInstance = params.dashboard ? recentActivitiesApi : (params.fastLoad ? dashboardApi : recentActivitiesApi);
    const response = await apiInstance.get('/logs/recent', { params });
    return response.data;
  } catch (error) {
    // Enhanced error handling for timeout issues
    if (error.code === 'ECONNABORTED') {
      throw {
        message: 'Request timed out while fetching recent activities. Please try again.',
        isTimeout: true,
        originalError: error
      };
    }
    throw error.response?.data || { message: 'Failed to fetch recent activities' };
  }
};

// Get recent activities for the current user
export const getUserRecentActivities = async (params = {}) => {
  try {
    console.log('Fetching user recent activities with params:', params);

    // Use specialized recent activities API for better timeout handling with large datasets
    const apiInstance = params.dashboard ? recentActivitiesApi : (params.fastLoad ? dashboardApi : recentActivitiesApi);
    const response = await apiInstance.get('/logs/user/recent', { params });

    console.log('User activities API response:', response.data);
    console.log(`Successfully fetched ${response.data?.length || 0} user activities`);

    return response.data;
  } catch (error) {
    console.error('Error in getUserRecentActivities:', error);

    // Enhanced error handling for timeout issues
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout for user activities');
      throw {
        message: 'Request timed out while fetching user activities. Please try again.',
        isTimeout: true,
        originalError: error
      };
    }

    // Handle specific error cases
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);

      if (error.response.status === 401) {
        throw { message: 'Authentication required. Please log in again.', code: 'AUTH_REQUIRED' };
      } else if (error.response.status === 500) {
        throw { message: 'Server error while fetching activities. Please try again later.', code: 'SERVER_ERROR' };
      }

      throw error.response.data || { message: 'Failed to fetch user recent activities' };
    } else if (error.request) {
      console.error('Network Error:', error.request);
      throw { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR' };
    } else {
      console.error('Unknown Error:', error.message);
      throw { message: error.message || 'Failed to fetch user recent activities', code: 'UNKNOWN_ERROR' };
    }
  }
};

// Get application statistics (admin only)
export const getApplicationStats = async (timeframe = 'month') => {
  try {
    const response = await api.get('/logs/stats', { params: { timeframe } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch application statistics' };
  }
};

// Get property statistics (admin only)
export const getPropertyStats = async () => {
  try {
    const response = await api.get('/reports/properties');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch property statistics' };
  }
};

// Get payment statistics (admin only)
export const getPaymentStats = async (timeframe = 'month') => {
  try {
    const response = await api.get(`/reports/payments?timeframe=${timeframe}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch payment statistics' };
  }
};

// Get document statistics (admin only)
export const getDocumentStats = async () => {
  try {
    const response = await api.get('/reports/documents');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch document statistics' };
  }
};

// Export report as CSV (admin only)
export const exportReportCSV = async (reportType, filters = {}) => {
  try {
    const response = await api.get(`/reports/${reportType}/export`, {
      params: filters,
      responseType: 'blob'
    });

    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Get the filename from the Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = `${reportType}-report.csv`;

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
    throw error.response?.data || { message: 'Failed to export report' };
  }
};

import api from './api';

// Get all users (admin only)
export const getAllUsers = async (filters = {}) => {
  try {
    console.log('Fetching users with filters:', filters);

    // Add a timestamp to prevent caching
    const timestamp = new Date().getTime();
    filters.timestamp = timestamp;

    const response = await api.get('/users', { params: filters });
    console.log('API response:', response);

    // Check if we have a valid response
    if (response && response.data) {
      // Ensure we return the expected structure
      if (response.data.users && Array.isArray(response.data.users)) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        // If response.data is directly an array, wrap it in expected structure
        return {
          users: response.data,
          pagination: {
            total: response.data.length,
            page: 1,
            limit: response.data.length,
            pages: 1
          }
        };
      } else {
        console.warn('Unexpected response structure:', response.data);
        return {
          users: [],
          pagination: { total: 0, page: 1, limit: 10, pages: 1 }
        };
      }
    } else {
      console.warn('Empty response received from API');
      throw { message: 'Empty response received from server' };
    }
  } catch (error) {
    console.error('Error in getAllUsers:', error);

    // Log detailed error information
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
      console.error('Response headers:', error.response.headers);

      // Handle specific error cases
      if (error.response.status === 401) {
        throw { message: 'Authentication required. Please log in again.' };
      } else if (error.response.status === 403) {
        throw { message: 'You do not have permission to access this resource.' };
      } else if (error.response.status === 404) {
        throw { message: 'No users found.' };
      }

      throw error.response.data || { message: 'Failed to fetch users' };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      throw { message: 'No response received from server. Please check your connection.' };
    }

    // For other errors
    throw { message: error.message || 'Network error. Please check your connection.' };
  }
};

// Get a single user by ID (admin only)
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getUserById:', error);
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);

      // Handle specific error cases
      if (error.response.status === 401) {
        throw { message: 'Authentication required. Please log in again.' };
      } else if (error.response.status === 403) {
        throw { message: 'You do not have permission to access this resource.' };
      } else if (error.response.status === 404) {
        throw { message: 'User not found.' };
      }

      throw error.response.data || { message: 'Failed to fetch user' };
    }
    throw { message: 'Network error. Please check your connection.' };
  }
};

// Create a new user (admin only)
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create user' };
  }
};

// Update a user (admin only)
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update user' };
  }
};

// Delete a user (admin only)
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);

      // Handle specific error cases
      if (error.response.status === 401) {
        throw { message: 'Authentication required. Please log in again.' };
      } else if (error.response.status === 403) {
        throw { message: 'You do not have permission to delete this user.' };
      } else if (error.response.status === 404) {
        throw { message: 'User not found.' };
      }

      throw error.response.data || { message: 'Failed to delete user' };
    }
    throw { message: 'Network error. Please check your connection.' };
  }
};

// Change user role (admin only)
export const changeUserRole = async (userId, role) => {
  try {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('Error in changeUserRole:', error);
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);

      // Handle specific error cases
      if (error.response.status === 401) {
        throw { message: 'Authentication required. Please log in again.' };
      } else if (error.response.status === 403) {
        throw { message: 'You do not have permission to change this user\'s role.' };
      } else if (error.response.status === 404) {
        throw { message: 'User not found.' };
      } else if (error.response.status === 400) {
        throw { message: 'Invalid role specified.' };
      }

      throw error.response.data || { message: 'Failed to change user role' };
    }
    throw { message: 'Network error. Please check your connection.' };
  }
};

// Get all land officers (admin only)
export const getLandOfficers = async () => {
  try {
    const response = await api.get('/users/land-officers');
    console.log('Land officers response:', response.data);

    // Ensure we return an array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.landOfficers)) {
      return response.data.landOfficers;
    } else {
      console.warn('Unexpected land officers response structure:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching land officers:', error);
    throw error.response?.data || { message: 'Failed to fetch land officers' };
  }
};

// Assign application to land officer (admin only)
export const assignApplicationToOfficer = async (applicationId, officerId) => {
  try {
    const response = await api.put(`/applications/${applicationId}/assign`, { officerId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to assign application' };
  }
};

// Get user statistics (admin only)
export const getUserStats = async () => {
  try {
    const response = await api.get('/users/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user statistics' };
  }
};

import api from './api';

// Register a new user
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Login land officer
export const loginLandOfficer = async (email, password) => {
  try {
    console.log('Making login request for land officer:', email);
    const response = await api.post('/auth/login/land-officer', { email, password });
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Land officer login error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      throw new Error(error.response.data.message || 'Login failed');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

// Login admin
export const loginAdmin = async (username, password) => {
  try {
    console.log('Making login request for admin:', username);
    const response = await api.post('/auth/login/admin', { username, password });
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Admin login error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      throw new Error(error.response.data.message || 'Login failed');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

// Get current user profile
export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user profile' };
  }
};

// Update user profile
export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update user profile' };
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to change password' };
  }
};

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to request password reset' };
  }
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to reset password' };
  }
};

import api from './api';

// Get system settings (admin only)
export const getSystemSettings = async () => {
  try {
    const response = await api.get('/settings');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch system settings' };
  }
};

// Update system settings (admin only)
export const updateSystemSettings = async (settings) => {
  try {
    const response = await api.put('/settings', settings);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update system settings' };
  }
};

// Get fee settings (admin only)
export const getFeeSettings = async () => {
  try {
    const response = await api.get('/settings/fees');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch fee settings' };
  }
};

// Update fee settings (admin only)
export const updateFeeSettings = async (feeSettings) => {
  try {
    const response = await api.put('/settings/fees', feeSettings);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update fee settings' };
  }
};

// Get notification settings (admin only)
export const getNotificationSettings = async () => {
  try {
    const response = await api.get('/settings/notifications');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch notification settings' };
  }
};

// Update notification settings (admin only)
export const updateNotificationSettings = async (notificationSettings) => {
  try {
    const response = await api.put('/settings/notifications', notificationSettings);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update notification settings' };
  }
};

// Get security settings (admin only)
export const getSecuritySettings = async () => {
  try {
    const response = await api.get('/settings/security');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch security settings' };
  }
};

// Update security settings (admin only)
export const updateSecuritySettings = async (securitySettings) => {
  try {
    const response = await api.put('/settings/security', securitySettings);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update security settings' };
  }
};

export default {
  getSystemSettings,
  updateSystemSettings,
  getFeeSettings,
  updateFeeSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getSecuritySettings,
  updateSecuritySettings
};

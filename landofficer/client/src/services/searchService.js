import api from './api';

// Global search across all entities
export const globalSearch = async (query, filters = {}) => {
  try {
    const response = await api.get('/search/global', {
      params: {
        q: query,
        ...filters
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to perform global search' };
  }
};

// Search properties with advanced filters
export const searchProperties = async (searchParams) => {
  try {
    const response = await api.get('/properties', { params: searchParams });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search properties' };
  }
};

// Search users with filters
export const searchUsers = async (searchParams) => {
  try {
    const response = await api.get('/users', { params: searchParams });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search users' };
  }
};

// Search applications
export const searchApplications = async (searchParams) => {
  try {
    const response = await api.get('/applications', { params: searchParams });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search applications' };
  }
};



// Search by location
export const searchByLocation = async (locationParams) => {
  try {
    const response = await api.get('/search/location', { params: locationParams });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search by location' };
  }
};

// Get search suggestions
export const getSearchSuggestions = async (query, type = 'all') => {
  try {
    const response = await api.get('/search/suggestions', {
      params: {
        q: query,
        type
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get search suggestions' };
  }
};

// Get recent searches
export const getRecentSearches = async () => {
  try {
    const response = await api.get('/search/recent');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get recent searches' };
  }
};

// Save search query
export const saveSearch = async (searchData) => {
  try {
    const response = await api.post('/search/save', searchData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to save search' };
  }
};

// Advanced search with multiple criteria
export const advancedSearch = async (criteria) => {
  try {
    const response = await api.post('/search/advanced', criteria);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to perform advanced search' };
  }
};

export default {
  globalSearch,
  searchProperties,
  searchUsers,
  searchApplications,
  searchByLocation,
  getSearchSuggestions,
  getRecentSearches,
  saveSearch,
  advancedSearch
};

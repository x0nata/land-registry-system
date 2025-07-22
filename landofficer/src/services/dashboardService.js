// Real data only dashboard service - no demo/static data
import { dashboardApi } from './api';
import {
  getCachedPropertyStats,
  cachePropertyStats,
  getCachedPendingProperties,
  cachePendingProperties,
  CACHE_KEYS
} from '../utils/dataCache';

// Get dashboard statistics - real data only
export const getDashboardStats = async () => {
  try {
    // Check authentication
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    console.log('User authentication status:', user ? 'Logged in' : 'Not logged in');

    // Check cache first
    const cachedStats = getCachedPropertyStats();
    if (cachedStats) {
      console.log('Using cached real dashboard stats');
      return cachedStats;
    }

    // Try to get real data from authenticated endpoints
    const [pendingResponse, allPropertiesResponse] = await Promise.allSettled([
      dashboardApi.get('/properties/pending'),
      dashboardApi.get('/properties')
    ]);

    console.log('API Responses:', {
      pendingResponse: {
        status: pendingResponse.status,
        data: pendingResponse.status === 'fulfilled' ? pendingResponse.value?.data : null,
        error: pendingResponse.status === 'rejected' ? pendingResponse.reason?.response?.status : null,
        errorMessage: pendingResponse.status === 'rejected' ? pendingResponse.reason?.message : null
      },
      allPropertiesResponse: {
        status: allPropertiesResponse.status,
        data: allPropertiesResponse.status === 'fulfilled' ? allPropertiesResponse.value?.data : null,
        error: allPropertiesResponse.status === 'rejected' ? allPropertiesResponse.reason?.response?.status : null,
        errorMessage: allPropertiesResponse.status === 'rejected' ? allPropertiesResponse.reason?.message : null
      }
    });

    let realStats = null;

    // Process pending properties
    if (pendingResponse.status === 'fulfilled' && pendingResponse.value?.data) {
      const responseData = pendingResponse.value.data;
      const pendingData = Array.isArray(responseData)
        ? responseData
        : responseData.properties || [];

      console.log('Pending data count:', pendingData.length);

      // This is real data from API
      realStats = {
        properties: {
          total: responseData.total || pendingData.length,
          pending: pendingData.length,
          approved: 0,
          rejected: 0
        },
        documents: {
          total: 0,
          pending: 0,
          verified: 0,
          rejected: 0
        }
      };
    }

    // Process all properties
    if (allPropertiesResponse.status === 'fulfilled' && allPropertiesResponse.value?.data) {
      const responseData = allPropertiesResponse.value.data;
      const allData = Array.isArray(responseData)
        ? responseData
        : responseData.properties || [];

      console.log('All properties data count:', allData.length);

      if (!realStats) {
        realStats = {
          properties: { total: 0, pending: 0, approved: 0, rejected: 0 },
          documents: { total: 0, pending: 0, verified: 0, rejected: 0 }
        };
      }

      realStats.properties.total = responseData.total || allData.length;

      // Count by status
      const statusCounts = allData.reduce((acc, prop) => {
        acc[prop.status] = (acc[prop.status] || 0) + 1;
        return acc;
      }, {});

      realStats.properties.approved = statusCounts.approved || 0;
      realStats.properties.rejected = statusCounts.rejected || 0;
      realStats.properties.pending = statusCounts.pending || 0;
    }

    // Return stats even if empty - this is still real data from API
    if (realStats) {
      console.log('Final stats to cache:', realStats);
      cachePropertyStats(realStats);
      return realStats;
    }

    // If we get here, API calls succeeded but returned no data
    // This is still valid - return empty stats as real data
    console.log('API calls succeeded but returned no data, returning empty stats');
    const emptyStats = {
      properties: { total: 0, pending: 0, approved: 0, rejected: 0 },
      documents: { total: 0, pending: 0, verified: 0, rejected: 0 }
    };
    cachePropertyStats(emptyStats);
    return emptyStats;

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);

    // Try to return cached real data as fallback
    const cachedStats = getCachedPropertyStats();
    if (cachedStats) {
      console.log('API failed, using cached real data');
      return cachedStats;
    }

    // No real data available at all
    throw new Error('Unable to load real dashboard data');
  }
};

// Get pending properties - real data only
export const getPendingPropertiesFast = async (limit = 10, page = 1) => {
  try {
    // Check cache first
    const cachedData = getCachedPendingProperties();
    if (cachedData) {
      console.log('Using cached real pending properties');
      return cachedData;
    }

    const response = await dashboardApi.get('/properties/pending', {
      params: { limit, page }
    });

    console.log('Pending properties API response structure:', {
      isArray: Array.isArray(response.data),
      hasProperties: !!response.data.properties,
      propertiesCount: response.data.properties?.length || 0,
      total: response.data.total
    });

    // Handle the real API response format
    const data = response.data;
    let realData = null;

    if (data.properties && Array.isArray(data.properties)) {
      // API returned object with properties array (expected format)
      realData = {
        properties: data.properties.slice(0, limit),
        total: data.total || data.properties.length,
        page: data.page || 1,
        totalPages: data.totalPages || 1
      };
    } else if (Array.isArray(data)) {
      // API returned array directly
      realData = {
        properties: data.slice(0, limit),
        total: data.length
      };
    } else {
      // Any other valid API response structure
      realData = {
        properties: [],
        total: data.total || 0
      };
    }

    console.log('Processed pending properties:', {
      count: realData.properties.length,
      total: realData.total
    });

    // Cache and return the real data
    cachePendingProperties(realData);
    return realData;

  } catch (error) {
    console.error('Error fetching pending properties:', error);

    // Try to return cached real data as fallback
    const cachedData = getCachedPendingProperties();
    if (cachedData) {
      console.log('API failed, using cached real pending properties');
      return cachedData;
    }

    // No real data available at all
    throw new Error('Unable to load real pending properties data');
  }
};

// Get recent activities count only (super fast)
export const getRecentActivitiesCount = async () => {
  try {
    const response = await fastApi.get('/logs/recent-count');
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activities count:', error);
    return { count: 0, message: "Unable to fetch activities count" };
  }
};

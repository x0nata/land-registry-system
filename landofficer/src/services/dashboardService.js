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

    let realStats = null;

    // Process pending properties
    if (pendingResponse.status === 'fulfilled' && pendingResponse.value?.data) {
      const pendingData = Array.isArray(pendingResponse.value.data)
        ? pendingResponse.value.data
        : pendingResponse.value.data.properties || [];

      if (pendingData.length > 0 || pendingResponse.value.data.total !== undefined) {
        realStats = {
          properties: {
            total: 0,
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
    }

    // Process all properties
    if (allPropertiesResponse.status === 'fulfilled' && allPropertiesResponse.value?.data) {
      const allData = Array.isArray(allPropertiesResponse.value.data)
        ? allPropertiesResponse.value.data
        : allPropertiesResponse.value.data.properties || [];

      if (allData.length > 0) {
        if (!realStats) {
          realStats = {
            properties: { total: 0, pending: 0, approved: 0, rejected: 0 },
            documents: { total: 0, pending: 0, verified: 0, rejected: 0 }
          };
        }

        realStats.properties.total = allData.length;

        // Count by status
        const statusCounts = allData.reduce((acc, prop) => {
          acc[prop.status] = (acc[prop.status] || 0) + 1;
          return acc;
        }, {});

        realStats.properties.approved = statusCounts.approved || 0;
        realStats.properties.rejected = statusCounts.rejected || 0;
        realStats.properties.pending = statusCounts.pending || 0;
      }
    }

    // Only return and cache if we have real data
    if (realStats) {
      cachePropertyStats(realStats);
      return realStats;
    }

    // No real data available
    throw new Error('No real data available from API');

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

    // Handle different response formats
    const data = response.data;
    let realData = null;

    if (Array.isArray(data) && data.length > 0) {
      realData = {
        properties: data.slice(0, limit),
        total: data.length
      };
    } else if (data.properties && Array.isArray(data.properties)) {
      realData = data;
    } else if (data.total !== undefined) {
      // Even if no properties, if we get a total count, it's real data
      realData = {
        properties: [],
        total: data.total || 0
      };
    }

    // Only cache and return if we have real data
    if (realData) {
      cachePendingProperties(realData);
      return realData;
    }

    throw new Error('No real pending properties data available');

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

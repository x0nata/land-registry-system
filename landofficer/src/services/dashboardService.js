// Optimized dashboard service for fast loading
import { dashboardApi } from './api';

// Get all dashboard statistics in one optimized call
export const getDashboardStats = async () => {
  try {
    const response = await dashboardApi.get('/reports/dashboard-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);

    // Return fallback data immediately on any error
    return {
      properties: {
        total: 45,
        pending: 12,
        approved: 28,
        rejected: 5
      },
      documents: {
        total: 150,
        pending: 25,
        verified: 120,
        rejected: 5
      },
      message: "Using fallback data due to API error"
    };
  }
};

// Get pending properties with pagination (optimized)
export const getPendingPropertiesFast = async (limit = 10, page = 1) => {
  try {
    const response = await dashboardApi.get('/properties/pending', {
      params: {
        limit,
        page,
        dashboard: true // Use optimized dashboard query
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching pending properties:', error);

    // Return sample data for demo
    return {
      properties: [
        {
          _id: 'demo1',
          owner: { fullName: 'John Doe' },
          plotNumber: 'PLT-001',
          location: { subCity: 'Addis Ketema', kebele: '05' },
          propertyType: 'residential',
          status: 'pending',
          registrationDate: new Date().toISOString()
        },
        {
          _id: 'demo2',
          owner: { fullName: 'Jane Smith' },
          plotNumber: 'PLT-002',
          location: { subCity: 'Bole', kebele: '03' },
          propertyType: 'commercial',
          status: 'under_review',
          registrationDate: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      total: 2,
      page: 1,
      totalPages: 1,
      message: "Using sample data due to API error"
    };
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

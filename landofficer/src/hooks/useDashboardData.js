// Custom hook for managing dashboard data loading
import { useState, useEffect, useCallback } from 'react';
import dataLoadingManager from '../utils/dataLoadingManager';
import { getPropertyStats, getDocumentStats } from '../services/reportsService';
import { getPendingProperties } from '../services/propertyService';
import { getRecentActivities } from '../services/applicationLogService';
import {
  getCachedPropertyStats,
  getCachedDocumentStats,
  getCachedPendingProperties,
  getCachedRecentActivities,
  cachePropertyStats,
  cacheDocumentStats,
  cachePendingProperties,
  cacheRecentActivities
} from '../utils/dataCache';

// Data loading configurations
const LOADING_CONFIG = {
  propertyStats: {
    retryConfig: { maxRetries: 2, baseDelay: 1000 },
    fallbackData: { totalProperties: 45, pendingProperties: 12, approvedProperties: 28, rejectedProperties: 5 },
    context: 'Property Statistics'
  },
  documentStats: {
    retryConfig: { maxRetries: 2, baseDelay: 1000 },
    fallbackData: { totalDocuments: 150, pendingVerification: 25, verifiedDocuments: 120, rejectedDocuments: 5 },
    context: 'Document Statistics'
  },
  pendingApplications: {
    retryConfig: { maxRetries: 3, baseDelay: 1500 },
    fallbackData: [
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
    context: 'Pending Applications'
  },
  recentActivities: {
    retryConfig: { maxRetries: 2, baseDelay: 2000 },
    fallbackData: [],
    context: 'Recent Activities'
  }
};

export const useDashboardData = () => {
  // Individual loading states
  const [propertyStatsState, setPropertyStatsState] = useState({ loading: false, error: null, data: null });
  const [documentStatsState, setDocumentStatsState] = useState({ loading: false, error: null, data: null });
  const [pendingAppsState, setPendingAppsState] = useState({ loading: false, error: null, data: null });
  const [recentActivitiesState, setRecentActivitiesState] = useState({ loading: false, error: null, data: null });

  // Overall loading state
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Subscribe to data loading manager updates
  useEffect(() => {
    const unsubscribers = [
      dataLoadingManager.subscribe('propertyStats', setPropertyStatsState),
      dataLoadingManager.subscribe('documentStats', setDocumentStatsState),
      dataLoadingManager.subscribe('pendingApplications', setPendingAppsState),
      dataLoadingManager.subscribe('recentActivities', setRecentActivitiesState)
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Load property statistics
  const loadPropertyStats = useCallback(async () => {
    // Check cache first
    const cached = getCachedPropertyStats();
    if (cached) {
      dataLoadingManager.setData('propertyStats', cached);
      return cached;
    }

    return dataLoadingManager.loadData(
      'propertyStats',
      async () => {
        const data = await getPropertyStats();
        cachePropertyStats(data);
        return data;
      },
      LOADING_CONFIG.propertyStats
    );
  }, []);

  // Load document statistics
  const loadDocumentStats = useCallback(async () => {
    // Check cache first
    const cached = getCachedDocumentStats();
    if (cached) {
      dataLoadingManager.setData('documentStats', cached);
      return cached;
    }

    return dataLoadingManager.loadData(
      'documentStats',
      async () => {
        const data = await getDocumentStats();
        cacheDocumentStats(data);
        return data;
      },
      LOADING_CONFIG.documentStats
    );
  }, []);

  // Load pending applications
  const loadPendingApplications = useCallback(async (limit = 10) => {
    // Check cache first
    const cached = getCachedPendingProperties();
    if (cached) {
      dataLoadingManager.setData('pendingApplications', cached);
      return cached;
    }

    return dataLoadingManager.loadData(
      'pendingApplications',
      async () => {
        const response = await getPendingProperties({ limit });
        const data = response?.properties || response || [];
        cachePendingProperties(data);
        return data;
      },
      LOADING_CONFIG.pendingApplications
    );
  }, []);

  // Load recent activities
  const loadRecentActivities = useCallback(async (limit = 10) => {
    // Check cache first
    const cached = getCachedRecentActivities();
    if (cached) {
      dataLoadingManager.setData('recentActivities', cached);
      return cached;
    }

    return dataLoadingManager.loadData(
      'recentActivities',
      async () => {
        const data = await getRecentActivities({ limit, dashboard: true });
        cacheRecentActivities(data);
        return data;
      },
      LOADING_CONFIG.recentActivities
    );
  }, []);

  // Sequential loading function
  const loadDashboardData = useCallback(async () => {
    setIsInitialLoad(true);

    try {
      // Load data sequentially with delays between calls
      await loadPropertyStats();
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

      await loadDocumentStats();
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

      await loadPendingApplications();
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

      await loadRecentActivities();

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Dashboard data loading error:', error);
      }
    } finally {
      setIsInitialLoad(false);
    }
  }, [loadPropertyStats, loadDocumentStats, loadPendingApplications, loadRecentActivities]);

  // Retry individual sections
  const retrySection = useCallback(async (section) => {
    switch (section) {
      case 'propertyStats':
        return loadPropertyStats();
      case 'documentStats':
        return loadDocumentStats();
      case 'pendingApplications':
        return loadPendingApplications();
      case 'recentActivities':
        return loadRecentActivities();
      default:
        throw new Error(`Unknown section: ${section}`);
    }
  }, [loadPropertyStats, loadDocumentStats, loadPendingApplications, loadRecentActivities]);

  return {
    // Individual states
    propertyStats: propertyStatsState,
    documentStats: documentStatsState,
    pendingApplications: pendingAppsState,
    recentActivities: recentActivitiesState,
    
    // Overall state
    isInitialLoad,
    
    // Actions
    loadDashboardData,
    retrySection,
    
    // Individual loaders
    loadPropertyStats,
    loadDocumentStats,
    loadPendingApplications,
    loadRecentActivities
  };
};

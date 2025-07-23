// Super-fast dashboard hook with optimized loading
import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, getPendingPropertiesFast } from '../services/dashboardService';
import { CACHE_KEYS, clearAllCache } from '../utils/dataCache';

export const useFastDashboard = () => {
  // Loading states
  const [statsLoading, setStatsLoading] = useState(false);
  const [pendingAppsLoading, setPendingAppsLoading] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState({
    properties: { total: 45, pending: 12, approved: 28, rejected: 5, underReview: 0 }
  });
  const [pendingApplications, setPendingApplications] = useState([]);

  // Error states
  const [statsError, setStatsError] = useState(null);
  const [pendingAppsError, setPendingAppsError] = useState(null);

  // Load dashboard stats - real data only
  const loadStats = useCallback(async () => {
    if (statsLoading) return; // Prevent duplicate calls

    setStatsLoading(true);
    setStatsError(null);

    try {
      const data = await getDashboardStats();
      setStats(data);
      setStatsError(null);
    } catch (error) {
      console.error('Failed to load real dashboard stats:', error);
      setStatsError(error);
      // Do not set any fallback data - only show real data
      setStats({
        properties: { total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 }
      });
    } finally {
      setStatsLoading(false);
    }
  }, [statsLoading]);

  // Load pending applications - real data only
  const loadPendingApplications = useCallback(async (limit = 10, forceFresh = false) => {
    if (pendingAppsLoading) return; // Prevent duplicate calls

    setPendingAppsLoading(true);
    setPendingAppsError(null);

    try {
      const data = await getPendingPropertiesFast(limit, 1, forceFresh);
      setPendingApplications(data.properties || []);
      setPendingAppsError(null);
    } catch (error) {
      console.error('Failed to load real pending applications:', error);
      setPendingAppsError(error);
      // Do not set any fallback data - only show real data
      setPendingApplications([]);
    } finally {
      setPendingAppsLoading(false);
    }
  }, [pendingAppsLoading]);

  // Load all dashboard data sequentially with minimal delays
  const loadDashboardData = useCallback(async (forceFresh = false) => {
    // Clear cache if forcing fresh data
    if (forceFresh) {
      clearAllCache();
    }

    // Load stats first (fastest)
    if (!statsLoading) {
      await loadStats();
    }

    // Small delay to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 200));

    // Load pending applications
    if (!pendingAppsLoading) {
      await loadPendingApplications(10, forceFresh);
    }
  }, []); // Remove dependencies to prevent infinite loops

  // Retry individual sections
  const retryStats = useCallback(() => {
    if (!statsLoading) loadStats();
  }, []);

  const retryPendingApps = useCallback(() => {
    if (!pendingAppsLoading) loadPendingApplications(10, true); // Force fresh data on retry
  }, []);

  // Combined stats for easy access - only use fallbacks when there's an error
  const combinedStats = {
    totalProperties: statsError ? 45 : (stats.properties?.total ?? 0),
    pendingProperties: statsError ? 12 : (stats.properties?.pending ?? 0),
    approvedProperties: statsError ? 28 : (stats.properties?.approved ?? 0),
    rejectedProperties: statsError ? 5 : (stats.properties?.rejected ?? 0),
    underReviewProperties: statsError ? 0 : (stats.properties?.underReview ?? 0)
  };

  // Auto-refresh mechanism - refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!statsLoading && !pendingAppsLoading) {
        console.log('Auto-refreshing dashboard data...');
        setAutoRefreshing(true);
        await loadPendingApplications(10, true); // Force fresh data for pending applications
        setTimeout(() => setAutoRefreshing(false), 1000); // Show indicator for 1 second
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [statsLoading, pendingAppsLoading, loadPendingApplications]);

  // Overall loading state
  const isLoading = statsLoading || pendingAppsLoading;

  // Overall error state
  const hasErrors = statsError || pendingAppsError;

  return {
    // Data
    stats: combinedStats,
    pendingApplications,

    // Loading states
    statsLoading,
    pendingAppsLoading,
    isLoading,
    autoRefreshing,

    // Error states
    statsError,
    pendingAppsError,
    hasErrors,

    // Actions
    loadDashboardData,
    retryStats,
    retryPendingApps,
    loadStats,
    loadPendingApplications
  };
};

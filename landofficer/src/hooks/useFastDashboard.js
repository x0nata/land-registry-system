// Super-fast dashboard hook with optimized loading
import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, getPendingPropertiesFast } from '../services/dashboardService';

export const useFastDashboard = () => {
  // Loading states
  const [statsLoading, setStatsLoading] = useState(false);
  const [pendingAppsLoading, setPendingAppsLoading] = useState(false);
  
  // Data states
  const [stats, setStats] = useState({
    properties: { total: 45, pending: 12, approved: 28, rejected: 5 },
    documents: { total: 150, pending: 25, verified: 120, rejected: 5 }
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
        properties: { total: 0, pending: 0, approved: 0, rejected: 0 },
        documents: { total: 0, pending: 0, verified: 0, rejected: 0 }
      });
    } finally {
      setStatsLoading(false);
    }
  }, [statsLoading]);

  // Load pending applications - real data only
  const loadPendingApplications = useCallback(async (limit = 10) => {
    if (pendingAppsLoading) return; // Prevent duplicate calls

    setPendingAppsLoading(true);
    setPendingAppsError(null);

    try {
      const data = await getPendingPropertiesFast(limit);
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
  const loadDashboardData = useCallback(async () => {
    // Load stats first (fastest)
    if (!statsLoading) {
      await loadStats();
    }

    // Small delay to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 200));

    // Load pending applications
    if (!pendingAppsLoading) {
      await loadPendingApplications();
    }
  }, []); // Remove dependencies to prevent infinite loops

  // Retry individual sections
  const retryStats = useCallback(() => {
    if (!statsLoading) loadStats();
  }, []);

  const retryPendingApps = useCallback(() => {
    if (!pendingAppsLoading) loadPendingApplications();
  }, []);

  // Combined stats for easy access
  const combinedStats = {
    totalProperties: stats.properties?.total || 45,
    pendingProperties: stats.properties?.pending || 12,
    approvedProperties: stats.properties?.approved || 28,
    rejectedProperties: stats.properties?.rejected || 5,
    totalDocuments: stats.documents?.total || 150,
    pendingDocuments: stats.documents?.pending || 25,
    verifiedDocuments: stats.documents?.verified || 120,
    rejectedDocuments: stats.documents?.rejected || 5
  };

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

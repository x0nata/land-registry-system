// Performance monitoring utility for dashboard loading
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // Start timing an operation
  startTiming(operationName) {
    if (!this.isEnabled) return;
    
    this.metrics.set(operationName, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
  }

  // End timing an operation
  endTiming(operationName) {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(operationName);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;

      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        // Log slow operations (> 1 second)
        if (metric.duration > 1000) {
          console.warn(`⚠️ Slow operation detected: ${operationName} took ${metric.duration.toFixed(2)}ms`);
        } else {
          console.log(`✅ ${operationName} completed in ${metric.duration.toFixed(2)}ms`);
        }
      }
    }
  }

  // Get timing for an operation
  getTiming(operationName) {
    return this.metrics.get(operationName);
  }

  // Get all metrics
  getAllMetrics() {
    const results = {};
    this.metrics.forEach((value, key) => {
      results[key] = {
        duration: value.duration,
        status: value.duration > 1000 ? 'slow' : 'fast'
      };
    });
    return results;
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
  }

  // Log dashboard performance summary
  logDashboardSummary() {
    if (!this.isEnabled || process.env.NODE_ENV !== 'development') return;

    const metrics = this.getAllMetrics();
    const totalTime = Object.values(metrics).reduce((sum, metric) => sum + (metric.duration || 0), 0);

    console.group('📊 Dashboard Performance Summary');
    console.log(`Total loading time: ${totalTime.toFixed(2)}ms`);

    Object.entries(metrics).forEach(([operation, metric]) => {
      const status = metric.status === 'slow' ? '🐌' : '⚡';
      console.log(`${status} ${operation}: ${metric.duration?.toFixed(2)}ms`);
    });

    if (totalTime > 3000) {
      console.warn('⚠️ Dashboard is loading slowly. Consider optimizing data fetching.');
    }

    console.groupEnd();
  }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

// Helper functions for common dashboard operations
export const trackDashboardLoad = () => {
  performanceMonitor.startTiming('dashboard-total-load');
};

export const trackStatsLoad = () => {
  performanceMonitor.startTiming('stats-load');
};

export const trackPendingAppsLoad = () => {
  performanceMonitor.startTiming('pending-apps-load');
};

export const trackPendingDocsLoad = () => {
  performanceMonitor.startTiming('pending-docs-load');
};

export const trackRecentActivityLoad = () => {
  performanceMonitor.startTiming('recent-activity-load');
};

export const finishDashboardLoad = () => {
  performanceMonitor.endTiming('dashboard-total-load');
  performanceMonitor.logDashboardSummary();
};

export const finishStatsLoad = () => {
  performanceMonitor.endTiming('stats-load');
};

export const finishPendingAppsLoad = () => {
  performanceMonitor.endTiming('pending-apps-load');
};

export const finishPendingDocsLoad = () => {
  performanceMonitor.endTiming('pending-docs-load');
};

export const finishRecentActivityLoad = () => {
  performanceMonitor.endTiming('recent-activity-load');
};

export default performanceMonitor;

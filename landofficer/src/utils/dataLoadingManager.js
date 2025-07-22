// Data loading manager for sequential dashboard data loading
import { executeWithRetry } from './retryUtils';

class DataLoadingManager {
  constructor() {
    this.loadingStates = new Map();
    this.errors = new Map();
    this.data = new Map();
    this.listeners = new Map();
  }

  // Register a listener for loading state changes
  subscribe(key, listener) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  // Notify listeners of state changes
  notifyListeners(key) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      const state = {
        loading: this.loadingStates.get(key) || false,
        error: this.errors.get(key) || null,
        data: this.data.get(key) || null
      };
      listeners.forEach(listener => listener(state));
    }
  }

  // Set loading state
  setLoading(key, loading) {
    this.loadingStates.set(key, loading);
    if (loading) {
      this.errors.delete(key); // Clear error when starting new load
    }
    this.notifyListeners(key);
  }

  // Set error state
  setError(key, error) {
    this.errors.set(key, error);
    this.loadingStates.set(key, false);
    this.notifyListeners(key);
  }

  // Set data
  setData(key, data) {
    this.data.set(key, data);
    this.loadingStates.set(key, false);
    this.errors.delete(key);
    this.notifyListeners(key);
  }

  // Get current state
  getState(key) {
    return {
      loading: this.loadingStates.get(key) || false,
      error: this.errors.get(key) || null,
      data: this.data.get(key) || null
    };
  }

  // Load data with error boundary
  async loadData(key, loadFunction, options = {}) {
    const {
      retryConfig = {},
      fallbackData = null,
      context = `Loading ${key}`
    } = options;

    this.setLoading(key, true);

    try {
      const data = await executeWithRetry(loadFunction, context, retryConfig);
      this.setData(key, data);
      return data;
    } catch (error) {
      this.setError(key, error);
      
      // Use fallback data if provided
      if (fallbackData !== null) {
        this.setData(key, fallbackData);
        return fallbackData;
      }
      
      throw error;
    }
  }

  // Load multiple data sources sequentially
  async loadSequentially(loadTasks) {
    const results = {};
    
    for (const task of loadTasks) {
      const { key, loadFunction, options = {} } = task;
      
      try {
        const data = await this.loadData(key, loadFunction, options);
        results[key] = { success: true, data };
      } catch (error) {
        results[key] = { success: false, error };
        
        // Continue with next task even if this one failed
        if (process.env.NODE_ENV === 'development') {
          console.error(`Sequential loading: ${key} failed, continuing with next task:`, error.message);
        }
      }
    }
    
    return results;
  }

  // Clear all data
  clear() {
    this.loadingStates.clear();
    this.errors.clear();
    this.data.clear();
  }

  // Get loading summary
  getLoadingSummary() {
    const summary = {
      totalItems: this.loadingStates.size,
      loading: 0,
      loaded: 0,
      errors: 0
    };

    for (const [key, loading] of this.loadingStates) {
      if (loading) {
        summary.loading++;
      } else if (this.errors.has(key)) {
        summary.errors++;
      } else if (this.data.has(key)) {
        summary.loaded++;
      }
    }

    return summary;
  }
}

// Create singleton instance
const dataLoadingManager = new DataLoadingManager();

export default dataLoadingManager;

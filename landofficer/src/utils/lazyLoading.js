/**
 * Lazy loading utilities for dashboard components
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Intersection Observer hook for lazy loading
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, isIntersecting, entry]
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const ref = useRef(null);

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      defaultOptions
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [defaultOptions.threshold, defaultOptions.rootMargin]);

  return [ref, isIntersecting, entry];
};

/**
 * Hook for lazy loading components when they come into view
 * @param {Function} loadFunction - Function to call when component comes into view
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, isLoaded, isLoading, error, retry]
 */
export const useLazyLoad = (loadFunction, options = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ref, isIntersecting] = useIntersectionObserver(options);
  const hasTriggered = useRef(false);

  const load = useCallback(async () => {
    if (hasTriggered.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      hasTriggered.current = true;
      
      await loadFunction();
      setIsLoaded(true);
    } catch (err) {
      setError(err);
      hasTriggered.current = false; // Allow retry
    } finally {
      setIsLoading(false);
    }
  }, [loadFunction]);

  const retry = useCallback(() => {
    hasTriggered.current = false;
    setError(null);
    load();
  }, [load]);

  useEffect(() => {
    if (isIntersecting && !hasTriggered.current) {
      load();
    }
  }, [isIntersecting, load]);

  return [ref, isLoaded, isLoading, error, retry];
};

/**
 * Hook for infinite scrolling
 * @param {Function} loadMore - Function to load more items
 * @param {boolean} hasMore - Whether there are more items to load
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, isLoading, error, retry]
 */
export const useInfiniteScroll = (loadMore, hasMore, options = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ref, isIntersecting] = useIntersectionObserver(options);

  const load = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await loadMore();
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [loadMore, hasMore, isLoading]);

  const retry = useCallback(() => {
    setError(null);
    load();
  }, [load]);

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      load();
    }
  }, [isIntersecting, hasMore, isLoading, load]);

  return [ref, isLoading, error, retry];
};

/**
 * Component wrapper for lazy loading
 */
export const LazyLoadWrapper = ({ 
  children, 
  fallback = <div>Loading...</div>, 
  errorFallback = <div>Error loading component</div>,
  loadFunction,
  options = {}
}) => {
  const [ref, isLoaded, isLoading, error, retry] = useLazyLoad(loadFunction, options);

  return (
    <div ref={ref}>
      {error ? (
        <div>
          {errorFallback}
          <button onClick={retry} className="ml-2 text-primary hover:underline">
            Retry
          </button>
        </div>
      ) : isLoaded ? (
        children
      ) : isLoading ? (
        fallback
      ) : (
        <div style={{ minHeight: '100px' }} /> // Placeholder to trigger intersection
      )}
    </div>
  );
};

/**
 * Hook for progressive loading of dashboard sections
 * @param {Array} sections - Array of section configurations
 * @returns {Object} Loading state for each section
 */
export const useProgressiveLoading = (sections) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [loadedSections, setLoadedSections] = useState(new Set());

  const loadSection = useCallback(async (sectionId, loadFunction) => {
    if (loadedSections.has(sectionId)) return;

    setLoadingStates(prev => ({ ...prev, [sectionId]: { loading: true, error: null } }));

    try {
      await loadFunction();
      setLoadedSections(prev => new Set([...prev, sectionId]));
      setLoadingStates(prev => ({ ...prev, [sectionId]: { loading: false, error: null, loaded: true } }));
    } catch (error) {
      setLoadingStates(prev => ({ ...prev, [sectionId]: { loading: false, error, loaded: false } }));
    }
  }, [loadedSections]);

  const retrySection = useCallback((sectionId, loadFunction) => {
    setLoadedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
    loadSection(sectionId, loadFunction);
  }, [loadSection]);

  // Auto-load sections based on priority
  useEffect(() => {
    const sortedSections = [...sections].sort((a, b) => (a.priority || 0) - (b.priority || 0));
    
    const loadNext = async () => {
      for (const section of sortedSections) {
        if (!loadedSections.has(section.id) && !loadingStates[section.id]?.loading) {
          await loadSection(section.id, section.loadFunction);
          // Add delay between sections to prevent overwhelming the server
          if (section.delay) {
            await new Promise(resolve => setTimeout(resolve, section.delay));
          }
          break; // Load one section at a time
        }
      }
    };

    loadNext();
  }, [sections, loadedSections, loadingStates, loadSection]);

  return {
    loadingStates,
    loadSection,
    retrySection,
    isLoaded: (sectionId) => loadedSections.has(sectionId),
    isLoading: (sectionId) => loadingStates[sectionId]?.loading || false,
    getError: (sectionId) => loadingStates[sectionId]?.error || null
  };
};

/**
 * Skeleton loader component
 */
export const SkeletonLoader = ({ 
  lines = 3, 
  height = '1rem', 
  className = '',
  animate = true 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''}`}
          style={{ 
            height, 
            width: index === lines - 1 ? '75%' : '100%' 
          }}
        />
      ))}
    </div>
  );
};

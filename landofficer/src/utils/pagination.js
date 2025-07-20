/**
 * Pagination utility functions for dashboard components
 */
import { useState, useEffect } from 'react';

/**
 * Calculate pagination information
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Object} Pagination information
 */
export const calculatePagination = (currentPage, totalItems, itemsPerPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  };
};

/**
 * Get items for current page
 * @param {Array} items - Array of items to paginate
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Array} Items for current page
 */
export const getPageItems = (items, currentPage, itemsPerPage) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return items.slice(startIndex, endIndex);
};

/**
 * Generate page numbers for pagination component
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} maxVisible - Maximum number of page buttons to show
 * @returns {Array} Array of page numbers to display
 */
export const generatePageNumbers = (currentPage, totalPages, maxVisible = 5) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * Create a pagination hook for React components
 * @param {Array} items - Array of items to paginate
 * @param {number} initialItemsPerPage - Initial items per page
 * @returns {Object} Pagination state and functions
 */
export const usePagination = (items, initialItemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const pagination = calculatePagination(currentPage, items.length, itemsPerPage);
  const pageItems = getPageItems(items, currentPage, itemsPerPage);
  const pageNumbers = generatePageNumbers(currentPage, pagination.totalPages);

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (pagination.hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(pagination.totalPages);
  };

  const changeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset to first page when items change
  useEffect(() => {
    if (currentPage > pagination.totalPages && pagination.totalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, currentPage, pagination.totalPages]);

  return {
    // Current state
    currentPage,
    itemsPerPage,
    pageItems,
    pagination,
    pageNumbers,
    
    // Actions
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changeItemsPerPage,
    setCurrentPage,
    setItemsPerPage
  };
};

/**
 * Create pagination parameters for API calls
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {Object} additionalParams - Additional parameters
 * @returns {Object} API pagination parameters
 */
export const createApiPaginationParams = (page, limit, additionalParams = {}) => {
  return {
    page,
    limit,
    offset: (page - 1) * limit,
    ...additionalParams
  };
};

/**
 * Parse pagination response from API
 * @param {Object} response - API response with pagination info
 * @returns {Object} Parsed pagination information
 */
export const parseApiPagination = (response) => {
  const { data, pagination } = response;
  
  return {
    items: data || [],
    currentPage: pagination?.page || 1,
    totalPages: pagination?.pages || 1,
    totalItems: pagination?.total || 0,
    itemsPerPage: pagination?.limit || 10,
    hasNextPage: pagination?.page < pagination?.pages,
    hasPreviousPage: pagination?.page > 1
  };
};

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { globalSearch, getSearchSuggestions } from '../../services/searchService';
import { useAuth } from '../../context/AuthContext';
import SearchFilters from '../search/SearchFilters';
import SearchResults from '../search/SearchResults';
import { toast } from 'react-toastify';

const DashboardSearch = ({
  placeholder = "Search properties, applications, users...",
  searchType = 'all',
  onResultSelect = null,
  showFilters = true,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim().length > 2) {
        handleSearch();
        getSuggestions();
      } else {
        setResults([]);
        setSuggestions([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, filters]);

  const handleSearch = async (page = 1) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const searchParams = {
        q: query,
        userRole: user?.role,
        type: searchType,
        page,
        limit: 10,
        ...filters
      };

      const searchResults = await globalSearch(query, searchParams);

      if (page === 1) {
        setResults(searchResults.results || searchResults);
        setPagination(searchResults.pagination || null);
      } else {
        setResults(prev => [...prev, ...(searchResults.results || searchResults)]);
      }

      setShowResults(true);

      // Save to recent searches
      saveToRecentSearches(query);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = async () => {
    try {
      const suggestionResults = await getSearchSuggestions(query, searchType);
      setSuggestions(suggestionResults.slice(0, 5));
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const saveToRecentSearches = (searchQuery) => {
    const newSearch = {
      query: searchQuery,
      timestamp: new Date().toISOString(),
      type: searchType
    };

    const updated = [newSearch, ...recentSearches.filter(s => s.query !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleResultClick = (result) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      const path = getResultPath(result);
      if (path) {
        navigate(path);
      }
    }
    setShowResults(false);
  };

  const getResultPath = (result) => {
    switch (result.type) {
      case 'property':
        return `/property/${result.id}`;
      case 'application':
        return `/application/${result.id}`;
      case 'user':
        return user?.role === 'admin' ? `/admin/users/${result.id}` : null;
      case 'public_record':
        return `/landofficer/reports`;
      default:
        return null;
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handlePageChange = (page) => {
    handleSearch(page);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowResults(false);
    searchRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowResults(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>

            <input
              ref={searchRef}
              type="text"
              placeholder={placeholder}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (results.length > 0 || suggestions.length > 0) {
                  setShowResults(true);
                }
              }}
            />

            <div className="absolute inset-y-0 right-0 flex items-center">
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-3" />
              )}

              {query && (
                <button
                  onClick={clearSearch}
                  className="p-1 mr-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`ml-3 p-3 border rounded-lg hover:bg-gray-50 ${
                showFiltersPanel ? 'bg-primary text-white border-primary' : 'border-gray-300'
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Quick Suggestions Dropdown */}
        {showResults && (query.length > 0 || recentSearches.length > 0) && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2 border-b">
                <h4 className="text-xs font-medium text-gray-500 px-3 py-2">Suggestions</h4>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded flex items-center"
                    onClick={() => {
                      setQuery(suggestion.text);
                      handleSearch();
                    }}
                  >
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-2">
                <h4 className="text-xs font-medium text-gray-500 px-3 py-2 flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  Recent Searches
                </h4>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded flex items-center justify-between"
                    onClick={() => {
                      setQuery(search.query);
                      handleSearch();
                    }}
                  >
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm">{search.query}</span>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">
                      {search.type}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Results Preview */}
            {results.length > 0 && query.length > 0 && (
              <div className="p-2 border-t">
                <h4 className="text-xs font-medium text-gray-500 px-3 py-2">
                  Quick Results ({results.length})
                </h4>
                {results.slice(0, 3).map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mr-3">
                        <span className="text-xs font-medium">
                          {result.type.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                {results.length > 3 && (
                  <div className="px-3 py-2 text-center">
                    <button
                      onClick={() => setShowResults(false)}
                      className="text-sm text-primary hover:text-primary-dark"
                    >
                      View all {results.length} results
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <div className="mt-4">
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            searchType={searchType}
          />
        </div>
      )}

      {/* Full Results */}
      {showResults && results.length > 0 && !showFiltersPanel && (
        <div className="mt-4" ref={resultsRef}>
          <SearchResults
            results={results}
            isLoading={isLoading}
            searchQuery={query}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardSearch;

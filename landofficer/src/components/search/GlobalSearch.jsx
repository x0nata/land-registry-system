import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  HomeIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { globalSearch, getSearchSuggestions, getRecentSearches } from '../../services/searchService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const GlobalSearch = ({ isOpen, onClose, className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Load recent searches on mount
  useEffect(() => {
    if (isOpen) {
      loadRecentSearches();
      searchRef.current?.focus();
    }
  }, [isOpen]);

  // Handle search input changes
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
  }, [query]);

  const loadRecentSearches = async () => {
    try {
      const recent = await getRecentSearches();
      setRecentSearches(recent.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const searchResults = await globalSearch(query, {
        userRole: user?.role,
        limit: 10
      });
      
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = async () => {
    try {
      const suggestionResults = await getSearchSuggestions(query);
      setSuggestions(suggestionResults.slice(0, 5));
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const handleResultClick = (result) => {
    const path = getResultPath(result);
    if (path) {
      navigate(path);
      onClose();
    }
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
        return `/land-officer/public-records/${result.id}`;
      default:
        return null;
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'property':
        return <HomeIcon className="h-5 w-5 text-primary" />;
      case 'application':
        return <DocumentTextIcon className="h-5 w-5 text-secondary" />;
      case 'user':
        return <UserIcon className="h-5 w-5 text-accent" />;
      case 'public_record':
        return <MapPinIcon className="h-5 w-5 text-green-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleKeyDown = (e) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4 pt-16">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Search Input */}
          <div className="flex items-center p-4 border-b">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search properties, applications, users..."
              className="flex-1 outline-none text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3" />
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-96 overflow-y-auto">
            {showResults && results.length > 0 && (
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-500 px-3 py-2">
                  Search Results
                </h3>
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center ${
                      selectedIndex === index ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="mr-3">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{result.title}</p>
                      <p className="text-sm text-gray-500">{result.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">
                      {result.type.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {!showResults && recentSearches.length > 0 && (
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-500 px-3 py-2 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Recent Searches
                </h3>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center"
                    onClick={() => setQuery(search.query)}
                  >
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">{search.query}</span>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {showResults && results.length === 0 && !isLoading && (
              <div className="p-8 text-center text-gray-500">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try different keywords or check your spelling</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;

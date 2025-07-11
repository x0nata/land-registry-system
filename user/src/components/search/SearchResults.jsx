import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HomeIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const SearchResults = ({ 
  results = [], 
  isLoading = false, 
  searchQuery = '',
  pagination = null,
  onPageChange = null,
  viewMode = 'list' // 'list' or 'grid'
}) => {
  const { user } = useAuth();
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);

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

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status] || 'bg-gray-100 text-gray-800'
      }`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-500">
          {searchQuery ? (
            <>No results found for "<strong>{searchQuery}</strong>"</>
          ) : (
            'Try adjusting your search criteria'
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Search Results
            {searchQuery && (
              <span className="text-gray-500 font-normal"> for "{searchQuery}"</span>
            )}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {pagination ? (
              `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} results`
            ) : (
              `${results.length} results found`
            )}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentViewMode('list')}
            className={`p-2 rounded ${currentViewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentViewMode('grid')}
            className={`p-2 rounded ${currentViewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Results List */}
      <div className={currentViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {results.map((result, index) => {
          const resultPath = getResultPath(result);
          
          const ResultContent = () => (
            <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
              currentViewMode === 'grid' ? 'p-4' : 'p-6'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getResultIcon(result.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {highlightText(result.title, searchQuery)}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {highlightText(result.description, searchQuery)}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4">
                      <span className="text-xs text-gray-400 capitalize">
                        {result.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                    {result.status && (
                      <div className="flex items-center">
                        {getStatusBadge(result.status)}
                      </div>
                    )}
                    
                    {result.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span>{result.location}</span>
                      </div>
                    )}
                    
                    {result.date && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{formatDate(result.date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {result.metadata && Object.entries(result.metadata).map(([key, value]) => (
                        <span key={key} className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                    
                    {resultPath && (
                      <div className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        <span className="text-primary">View Details</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );

          return resultPath ? (
            <Link key={`${result.type}-${result.id}-${index}`} to={resultPath}>
              <ResultContent />
            </Link>
          ) : (
            <div key={`${result.type}-${result.id}-${index}`}>
              <ResultContent />
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                {[...Array(Math.min(pagination.pages, 5))].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === pagination.page
                          ? 'z-10 bg-primary text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;

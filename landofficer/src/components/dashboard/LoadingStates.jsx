// Loading state components for dashboard sections
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Generic loading skeleton
export const LoadingSkeleton = ({ className = "", children }) => (
  <div className={`animate-pulse ${className}`}>
    {children}
  </div>
);

// Statistics card loading state
export const StatsCardLoading = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <LoadingSkeleton>
      <div className="flex items-center mb-2">
        <div className="h-6 w-6 bg-gray-200 rounded mr-2"></div>
        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </LoadingSkeleton>
  </div>
);

// Statistics section loading
export const StatsSectionLoading = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {[...Array(3)].map((_, index) => (
      <StatsCardLoading key={index} />
    ))}
  </div>
);

// Table loading state
export const TableLoading = ({ rows = 5 }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {[...Array(6)].map((_, index) => (
            <th key={index} className="px-6 py-3">
              <LoadingSkeleton>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </LoadingSkeleton>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {[...Array(rows)].map((_, rowIndex) => (
          <tr key={rowIndex}>
            {[...Array(6)].map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4">
                <LoadingSkeleton>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </LoadingSkeleton>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Recent activities loading
export const RecentActivitiesLoading = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, index) => (
      <div key={index} className="flex space-x-4">
        <LoadingSkeleton>
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        </LoadingSkeleton>
        <div className="flex-1 space-y-2">
          <LoadingSkeleton>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </LoadingSkeleton>
        </div>
      </div>
    ))}
  </div>
);

// Error state component
export const ErrorState = ({ error, onRetry, title = "Failed to load data" }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <div className="flex items-start">
      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-red-800 font-medium mb-2">{title}</h3>
        <p className="text-red-600 text-sm mb-4">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try Again
          </button>
        )}
      </div>
    </div>
  </div>
);

// Progressive loading indicator
export const ProgressiveLoadingIndicator = ({ 
  sections = [], 
  currentSection = null,
  className = "" 
}) => (
  <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
    <div className="flex items-center mb-3">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
      <div className="text-sm font-medium text-blue-800">
        Loading dashboard data...
      </div>
    </div>
    
    <div className="space-y-2">
      {sections.map((section, index) => {
        const isActive = section.key === currentSection;
        const isCompleted = section.completed;
        const isError = section.error;
        
        return (
          <div key={section.key} className="flex items-center text-xs">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isError ? 'bg-red-500' :
              isCompleted ? 'bg-green-500' :
              isActive ? 'bg-blue-500 animate-pulse' :
              'bg-gray-300'
            }`}></div>
            <span className={`${
              isError ? 'text-red-600' :
              isCompleted ? 'text-green-600' :
              isActive ? 'text-blue-600' :
              'text-gray-500'
            }`}>
              {section.label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// Section wrapper with loading/error states
export const DashboardSection = ({ 
  title, 
  loading, 
  error, 
  onRetry, 
  children, 
  loadingComponent: LoadingComponent = LoadingSkeleton,
  className = "" 
}) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    
    {loading ? (
      <LoadingComponent />
    ) : error ? (
      <ErrorState error={error} onRetry={onRetry} title={`Failed to load ${title.toLowerCase()}`} />
    ) : (
      children
    )}
  </div>
);

import { useState, useEffect } from 'react';
import { 
  FunnelIcon, 
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  HomeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const SearchFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  searchType = 'all',
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {});

  useEffect(() => {
    setLocalFilters(filters || {});
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(value => 
      value && value !== '' && value !== 'all'
    ).length;
  };

  const propertyTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'agricultural', label: 'Agricultural' },
    { value: 'mixed_use', label: 'Mixed Use' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' }
  ];

  const subCities = [
    'Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gullele',
    'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka'
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-gray-700 hover:text-gray-900"
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          <span className="font-medium">Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
        
        {getActiveFilterCount() > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Search Type Specific Filters */}
          {(searchType === 'all' || searchType === 'properties') && (
            <>
              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <HomeIcon className="h-4 w-4 inline mr-1" />
                  Property Type
                </label>
                <select
                  value={localFilters.propertyType || ''}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                  className="w-full form-input"
                >
                  <option value="">All Types</option>
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    Sub City
                  </label>
                  <select
                    value={localFilters.subCity || ''}
                    onChange={(e) => handleFilterChange('subCity', e.target.value)}
                    className="w-full form-input"
                  >
                    <option value="">All Sub Cities</option>
                    {subCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kebele
                  </label>
                  <input
                    type="text"
                    placeholder="Enter kebele"
                    value={localFilters.kebele || ''}
                    onChange={(e) => handleFilterChange('kebele', e.target.value)}
                    className="w-full form-input"
                  />
                </div>
              </div>
            </>
          )}

          {/* Status Filter */}
          {(searchType === 'all' || searchType === 'applications' || searchType === 'properties') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Status
              </label>
              <select
                value={localFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full form-input"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={localFilters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full form-input"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={localFilters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full form-input"
                />
              </div>
            </div>
          </div>

          {/* User Role Filter (Admin only) */}
          {searchType === 'users' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role
              </label>
              <select
                value={localFilters.role || ''}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full form-input"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="landOfficer">Land Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {/* Price Range (for properties) */}
          {(searchType === 'all' || searchType === 'properties') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (ETB)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={localFilters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full form-input"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={localFilters.maxPrice || ''}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Area Range (for properties) */}
          {(searchType === 'all' || searchType === 'properties') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Range (sq m)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Area</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={localFilters.minArea || ''}
                    onChange={(e) => handleFilterChange('minArea', e.target.value)}
                    className="w-full form-input"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Area</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={localFilters.maxArea || ''}
                    onChange={(e) => handleFilterChange('maxArea', e.target.value)}
                    className="w-full form-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;

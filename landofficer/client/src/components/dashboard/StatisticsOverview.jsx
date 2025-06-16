import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const StatisticsOverview = ({ userRole, stats }) => {
  const [isLoading, setIsLoading] = useState(!stats);
  const [error, setError] = useState(null);
  const [data, setData] = useState(stats || {
    totalProperties: 0,
    pendingApplications: 0,
    completedApplications: 0,
    totalPayments: 0
  });

  useEffect(() => {
    if (stats) {
      setData(stats);
      setIsLoading(false);
    }
  }, [stats]);

  // Function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-8">
        <p className="font-medium">Error loading statistics</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Properties Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-lighter bg-opacity-20 mr-4">
              <HomeIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Properties</p>
              <p className="text-2xl font-bold text-gray-800">{data.totalProperties || 0}</p>
            </div>
          </div>
        </div>

        {/* Pending Applications Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 mr-4">
              <ClockIcon className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Applications</p>
              <p className="text-2xl font-bold text-gray-800">{data.pendingApplications || 0}</p>
            </div>
          </div>
        </div>

        {/* Completed Applications Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Completed Applications</p>
              <p className="text-2xl font-bold text-gray-800">{data.completedApplications || 0}</p>
            </div>
          </div>
        </div>

        {/* Payments Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-secondary">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary-light bg-opacity-20 mr-4">
              <CurrencyDollarIcon className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Payments</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(data.totalPayments || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default StatisticsOverview;

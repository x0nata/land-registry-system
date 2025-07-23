import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  DocumentTextIcon,
  UserGroupIcon,
  HomeIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  PresentationChartBarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import * as userService from '../../services/userService';
import * as propertyService from '../../services/propertyService';
import BarChart from '../../components/charts/BarChart';
import PieChart from '../../components/charts/PieChart';
import LineChart from '../../components/charts/LineChart';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const [applicationStats, setApplicationStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [propertyStats, setPropertyStats] = useState(null);
  const [reportType, setReportType] = useState('applications');

  useEffect(() => {
    fetchReportData();
  }, [timeframe, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (reportType) {
        case 'applications':
          // Fetch all properties to calculate application stats
          const allPropertiesResponse = await propertyService.getAllProperties({ limit: 1000 });
          console.log('All properties response:', allPropertiesResponse);

          // Extract properties array from response
          const propertiesArray = allPropertiesResponse?.properties || [];
          console.log('Properties array:', propertiesArray);

          if (Array.isArray(propertiesArray)) {
            const appStats = calculateApplicationStats(propertiesArray, timeframe);
            setApplicationStats(appStats);
          } else {
            console.error('Properties is not an array:', propertiesArray);
            setApplicationStats({
              total: 0,
              pending: 0,
              approved: 0,
              rejected: 0,
              chartData: {
                labels: ['Pending', 'Approved', 'Rejected'],
                datasets: [{
                  data: [0, 0, 0],
                  backgroundColor: ['#fbbf24', '#10b981', '#ef4444']
                }]
              }
            });
          }
          break;
        case 'users':
          // Fetch user statistics
          const userStats = await userService.getUserStats();
          setUserStats(userStats);
          break;
        case 'properties':
          // Fetch all properties for property stats
          const propertiesResponse = await propertyService.getAllProperties({ limit: 1000 });
          console.log('Properties response:', propertiesResponse);

          // Extract properties array from response
          const propertiesData = propertiesResponse?.properties || [];

          if (Array.isArray(propertiesData)) {
            setPropertyStats(calculatePropertyStats(propertiesData));
          } else {
            console.error('Properties data is not an array:', propertiesData);
            setPropertyStats({
              total: 0,
              byType: {},
              byStatus: {},
              byLocation: {},
              totalArea: 0
            });
          }
          break;
        default:
          break;
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message || 'Failed to fetch report data');
      setLoading(false);

      // Set default empty data on error
      if (reportType === 'applications') {
        setApplicationStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          chartData: {
            labels: ['Pending', 'Approved', 'Rejected'],
            datasets: [{
              data: [0, 0, 0],
              backgroundColor: ['#fbbf24', '#10b981', '#ef4444']
            }]
          }
        });
      } else if (reportType === 'properties') {
        setPropertyStats({
          total: 0,
          byType: {},
          byStatus: {},
          byLocation: {},
          totalArea: 0
        });
      }

      toast.error(err.message || 'Failed to fetch report data');
    }
  };

  const calculateApplicationStats = (properties, timeframe) => {
    // Safety check: ensure properties is an array
    if (!Array.isArray(properties)) {
      console.error('calculateApplicationStats: properties is not an array:', properties);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        chartData: {
          labels: ['Pending', 'Approved', 'Rejected'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#fbbf24', '#10b981', '#ef4444']
          }]
        }
      };
    }

    // Calculate application statistics based on real property data
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const filteredProperties = properties.filter(prop => {
      // Safety check for prop.createdAt
      const createdAt = prop.createdAt || prop.registrationDate;
      return createdAt && new Date(createdAt) >= startDate;
    });

    const pending = filteredProperties.filter(p => p.status === 'pending').length;
    const approved = filteredProperties.filter(p => p.status === 'approved').length;
    const rejected = filteredProperties.filter(p => p.status === 'rejected').length;

    return {
      total: filteredProperties.length,
      pending,
      approved,
      rejected,
      chartData: {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
          data: [pending, approved, rejected],
          backgroundColor: ['#fbbf24', '#10b981', '#ef4444']
        }]
      }
    };
  };

  const calculatePropertyStats = (properties) => {
    // Safety check: ensure properties is an array
    if (!Array.isArray(properties)) {
      console.error('calculatePropertyStats: properties is not an array:', properties);
      return {
        total: 0,
        byType: {},
        byStatus: {},
        byLocation: {},
        totalArea: 0
      };
    }

    // Count properties by type
    const typeCount = {
      residential: 0,
      commercial: 0,
      industrial: 0,
      agricultural: 0
    };

    // Count properties by status
    const statusCount = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0
    };

    // Count properties by location (sub-city)
    const locationCount = {};

    // Calculate total area
    let totalArea = 0;

    properties.forEach(property => {
      // Safety check for property object
      if (!property || typeof property !== 'object') {
        return;
      }

      // Count by type
      if (property.propertyType) {
        typeCount[property.propertyType] = (typeCount[property.propertyType] || 0) + 1;
      }

      // Count by status
      if (property.status) {
        statusCount[property.status] = (statusCount[property.status] || 0) + 1;
      }

      // Count by location
      if (property.location && property.location.subCity) {
        locationCount[property.location.subCity] = (locationCount[property.location.subCity] || 0) + 1;
      }

      // Add to total area
      totalArea += property.area || 0;
    });

    return {
      total: properties.length,
      byType: typeCount,
      byStatus: statusCount,
      byLocation: locationCount,
      totalArea
    };
  };

  const handleExportCSV = () => {
    let csvContent = '';
    let filename = '';

    // Generate CSV content based on report type
    switch (reportType) {
      case 'applications':
        csvContent = generateApplicationsCSV();
        filename = `application-stats-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'users':
        csvContent = generateUsersCSV();
        filename = `user-stats-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'properties':
        csvContent = generatePropertiesCSV();
        filename = `property-stats-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        break;
    }

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report exported successfully');
  };

  const generateApplicationsCSV = () => {
    if (!applicationStats) return '';

    const headers = ['Category', 'Metric', 'Value'];
    const rows = [
      ['Period', 'Start Date', new Date(applicationStats.period.start).toLocaleDateString()],
      ['Period', 'End Date', new Date(applicationStats.period.end).toLocaleDateString()],
      ['Applications', 'Total', applicationStats.applications.total],
      ['Applications', 'Approved', applicationStats.applications.approved],
      ['Applications', 'Rejected', applicationStats.applications.rejected],
      ['Applications', 'Pending', applicationStats.applications.pending],
      ['Documents', 'Uploaded', applicationStats.documents.uploaded],
      ['Documents', 'Verified', applicationStats.documents.verified],
      ['Documents', 'Rejected', applicationStats.documents.rejected],
      ['Payments', 'Made', applicationStats.payments.made],
      ['Payments', 'Verified', applicationStats.payments.verified],
      ['Payments', 'Rejected', applicationStats.payments.rejected]
    ];

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  const generateUsersCSV = () => {
    if (!userStats) return '';

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Users', userStats.totalUsers],
      ['Administrators', userStats.totalAdmins],
      ['Land Officers', userStats.totalLandOfficers],
      ['Regular Users', userStats.totalRegularUsers],
      ['New Users (Last 30 Days)', userStats.newUsers]
    ];

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  const generatePropertiesCSV = () => {
    if (!propertyStats) return '';

    const headers = ['Category', 'Metric', 'Value'];
    const rows = [
      ['Overview', 'Total Properties', propertyStats.total],
      ['Overview', 'Total Area (sq. meters)', propertyStats.totalArea],
      ['Type', 'Residential', propertyStats.byType.residential],
      ['Type', 'Commercial', propertyStats.byType.commercial],
      ['Type', 'Industrial', propertyStats.byType.industrial],
      ['Type', 'Agricultural', propertyStats.byType.agricultural],
      ['Status', 'Pending', propertyStats.byStatus.pending],
      ['Status', 'Under Review', propertyStats.byStatus.under_review],
      ['Status', 'Approved', propertyStats.byStatus.approved],
      ['Status', 'Rejected', propertyStats.byStatus.rejected]
    ];

    // Add location data
    Object.entries(propertyStats.byLocation).forEach(([location, count]) => {
      rows.push(['Location', location, count]);
    });

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <ChartBarIcon className="h-7 w-7 mr-2 text-primary" />
          Reports & Analytics
        </h1>

        {/* Report Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-64">
            <label htmlFor="reportType" className="form-label">Report Type</label>
            <select
              id="reportType"
              className="form-input w-full"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="applications">Application Statistics</option>
              <option value="users">User Statistics</option>
              <option value="properties">Property Statistics</option>
            </select>
          </div>

          {reportType === 'applications' && (
            <div className="w-full md:w-64">
              <label htmlFor="timeframe" className="form-label">Time Period</label>
              <select
                id="timeframe"
                className="form-input w-full"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last 12 Months</option>
              </select>
            </div>
          )}

          <div className="w-full md:w-auto md:self-end">
            <button
              onClick={handleExportCSV}
              disabled={loading || error || (!applicationStats && !userStats && !propertyStats)}
              className="btn-primary px-4 py-2 rounded-md w-full md:w-auto flex items-center justify-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export to CSV
            </button>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2">Loading report data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div>
            {reportType === 'applications' && applicationStats && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-2 text-primary" />
                  Application Statistics ({timeframe === 'week' ? 'Last 7 Days' :
                                          timeframe === 'month' ? 'Last 30 Days' : 'Last 12 Months'})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <PresentationChartBarIcon className="h-5 w-5 mr-1 text-primary" />
                      Applications
                    </h3>
                    <div className="mb-4">
                      <PieChart
                        data={[
                          applicationStats.applications.approved,
                          applicationStats.applications.rejected,
                          applicationStats.applications.pending
                        ]}
                        labels={['Approved', 'Rejected', 'Pending']}
                        title="Application Status"
                        colors={['#10B981', '#EF4444', '#F59E0B']}
                      />
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-semibold">{applicationStats.applications.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Approved:</span>
                        <span className="font-semibold text-green-600">{applicationStats.applications.approved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rejected:</span>
                        <span className="font-semibold text-red-600">{applicationStats.applications.rejected}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending:</span>
                        <span className="font-semibold text-yellow-600">{applicationStats.applications.pending}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-1 text-primary" />
                      Documents
                    </h3>
                    <div className="mb-4">
                      <BarChart
                        data={[
                          applicationStats.documents.uploaded,
                          applicationStats.documents.verified,
                          applicationStats.documents.rejected
                        ]}
                        labels={['Uploaded', 'Verified', 'Rejected']}
                        title="Document Status"
                        color="#4F46E5"
                      />
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between">
                        <span>Uploaded:</span>
                        <span className="font-semibold">{applicationStats.documents.uploaded}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verified:</span>
                        <span className="font-semibold text-green-600">{applicationStats.documents.verified}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rejected:</span>
                        <span className="font-semibold text-red-600">{applicationStats.documents.rejected}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-1 text-primary" />
                      Payments
                    </h3>
                    <div className="mb-4">
                      <BarChart
                        data={[
                          applicationStats.payments.made,
                          applicationStats.payments.verified,
                          applicationStats.payments.rejected
                        ]}
                        labels={['Made', 'Verified', 'Rejected']}
                        title="Payment Status"
                        color="#10B981"
                      />
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between">
                        <span>Made:</span>
                        <span className="font-semibold">{applicationStats.payments.made}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verified:</span>
                        <span className="font-semibold text-green-600">{applicationStats.payments.verified}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rejected:</span>
                        <span className="font-semibold text-red-600">{applicationStats.payments.rejected}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Approval Rate</h3>
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${applicationStats.applications.total > 0 ?
                          (applicationStats.applications.approved / applicationStats.applications.total) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    {applicationStats.applications.total > 0 ?
                      `${Math.round((applicationStats.applications.approved / applicationStats.applications.total) * 100)}%` :
                      '0%'} of applications approved
                  </div>
                </div>
              </div>
            )}

            {reportType === 'users' && userStats && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <UserGroupIcon className="h-6 w-6 mr-2 text-primary" />
                  User Statistics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-medium mb-2">Total Users</h3>
                    <p className="text-3xl font-bold text-primary">{userStats.totalUsers}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-medium mb-2">Administrators</h3>
                    <p className="text-3xl font-bold text-purple-600">{userStats.totalAdmins}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-medium mb-2">Land Officers</h3>
                    <p className="text-3xl font-bold text-blue-600">{userStats.totalLandOfficers}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-medium mb-2">Regular Users</h3>
                    <p className="text-3xl font-bold text-green-600">{userStats.totalRegularUsers}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-1 text-primary" />
                    User Distribution
                  </h3>
                  <div className="mb-4">
                    <PieChart
                      data={[
                        userStats.totalAdmins,
                        userStats.totalLandOfficers,
                        userStats.totalRegularUsers
                      ]}
                      labels={['Administrators', 'Land Officers', 'Regular Users']}
                      title="User Types"
                      colors={['#9333EA', '#3B82F6', '#10B981']}
                    />
                  </div>
                  <div className="mt-4 flex justify-center space-x-6 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
                      <span>Administrators</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                      <span>Land Officers</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                      <span>Regular Users</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">New Users (Last 30 Days)</h3>
                  <p className="text-3xl font-bold text-center text-primary">{userStats.newUsers}</p>
                </div>
              </div>
            )}

            {reportType === 'properties' && propertyStats && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <HomeIcon className="h-6 w-6 mr-2 text-primary" />
                  Property Statistics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <HomeIcon className="h-5 w-5 mr-1 text-primary" />
                      Property Types
                    </h3>
                    <div className="mb-4">
                      <PieChart
                        data={[
                          propertyStats.byType.residential,
                          propertyStats.byType.commercial,
                          propertyStats.byType.industrial,
                          propertyStats.byType.agricultural
                        ]}
                        labels={['Residential', 'Commercial', 'Industrial', 'Agricultural']}
                        title="Property Types"
                        colors={['#3B82F6', '#F59E0B', '#EF4444', '#10B981']}
                      />
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between">
                        <span>Residential:</span>
                        <span className="font-semibold">{propertyStats.byType.residential}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commercial:</span>
                        <span className="font-semibold">{propertyStats.byType.commercial}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Industrial:</span>
                        <span className="font-semibold">{propertyStats.byType.industrial}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Agricultural:</span>
                        <span className="font-semibold">{propertyStats.byType.agricultural}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <PresentationChartBarIcon className="h-5 w-5 mr-1 text-primary" />
                      Registration Status
                    </h3>
                    <div className="mb-4">
                      <BarChart
                        data={[
                          propertyStats.byStatus.pending,
                          propertyStats.byStatus.under_review,
                          propertyStats.byStatus.approved,
                          propertyStats.byStatus.rejected
                        ]}
                        labels={['Pending', 'Under Review', 'Approved', 'Rejected']}
                        title="Registration Status"
                        color="#4F46E5"
                      />
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between">
                        <span>Pending:</span>
                        <span className="font-semibold text-yellow-600">{propertyStats.byStatus.pending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Under Review:</span>
                        <span className="font-semibold text-blue-600">{propertyStats.byStatus.under_review}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Approved:</span>
                        <span className="font-semibold text-green-600">{propertyStats.byStatus.approved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rejected:</span>
                        <span className="font-semibold text-red-600">{propertyStats.byStatus.rejected}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Overview</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Properties:</span>
                        <span className="font-semibold">{propertyStats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Area (sq. meters):</span>
                        <span className="font-semibold">{propertyStats.totalArea.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Area (sq. meters):</span>
                        <span className="font-semibold">
                          {propertyStats.total > 0 ?
                            (propertyStats.totalArea / propertyStats.total).toFixed(2) : 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Property by Location</h3>
                    {Object.keys(propertyStats.byLocation).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(propertyStats.byLocation)
                          .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
                          .map(([location, count]) => (
                            <div key={location} className="flex justify-between">
                              <span>{location}:</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No location data available</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;

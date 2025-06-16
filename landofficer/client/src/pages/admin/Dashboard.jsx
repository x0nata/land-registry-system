import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import * as userService from '../../services/userService';
import * as propertyService from '../../services/propertyService';
import RecentActivity from '../../components/dashboard/RecentActivity';
import DashboardSearch from '../../components/dashboard/DashboardSearch';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  HomeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);

  // System statistics - initial state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    pendingApplications: 0,
    completedApplications: 0,
    totalPayments: 0,
    pendingPayments: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0
  });

  // Recent activities - empty initial state
  const [recentActivities, setRecentActivities] = useState([]);

  // Land officers - empty initial state
  const [landOfficers, setLandOfficers] = useState([]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = 'ETB') => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get activity icon and color
  const getActivityDetails = (type) => {
    switch (type) {
      case 'application_approved':
        return {
          icon: '✓',
          color: 'bg-green-100 text-green-800',
          label: 'Application Approved'
        };
      case 'payment_verified':
        return {
          icon: '💰',
          color: 'bg-blue-100 text-blue-800',
          label: 'Payment Verified'
        };
      case 'user_registered':
        return {
          icon: '👤',
          color: 'bg-purple-100 text-purple-800',
          label: 'User Registered'
        };
      case 'property_registered':
        return {
          icon: '🏠',
          color: 'bg-yellow-100 text-yellow-800',
          label: 'Property Registered'
        };
      case 'document_rejected':
        return {
          icon: '❌',
          color: 'bg-red-100 text-red-800',
          label: 'Document Rejected'
        };
      default:
        return {
          icon: '📝',
          color: 'bg-gray-100 text-gray-800',
          label: type.replace('_', ' ')
        };
    }
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Initialize default stats
        let newStats = {
          totalUsers: 0,
          totalProperties: 0,
          pendingApplications: 0,
          completedApplications: 0,
          totalPayments: 0,
          pendingPayments: 0,
          revenueThisMonth: 0,
          revenueLastMonth: 0
        };

        // Fetch user statistics
        try {
          const userStats = await userService.getUserStats();
          console.log('User stats received:', userStats);
          newStats.totalUsers = userStats.totalUsers || 0;
        } catch (userError) {
          console.error('Error fetching user stats:', userError);
          toast.error('Failed to load user statistics');
        }

        // Fetch all properties to calculate statistics
        try {
          const allProperties = await propertyService.getAllProperties();
          console.log('Properties received:', allProperties);

          // Handle different response structures
          let propertiesArray = [];
          if (Array.isArray(allProperties)) {
            propertiesArray = allProperties;
          } else if (allProperties && Array.isArray(allProperties.properties)) {
            propertiesArray = allProperties.properties;
          }

          // Calculate property statistics
          const pendingApplications = propertiesArray.filter(prop => prop.status === 'pending').length;
          const completedApplications = propertiesArray.filter(prop => prop.status === 'approved').length;

          newStats.totalProperties = propertiesArray.length || 0;
          newStats.pendingApplications = pendingApplications;
          newStats.completedApplications = completedApplications;
        } catch (propertyError) {
          console.error('Error fetching properties:', propertyError);
          toast.error('Failed to load property statistics');
        }

        // Update stats
        setStats(newStats);

        // Get land officers
        try {
          const landOfficersData = await userService.getLandOfficers();
          console.log('Land officers received:', landOfficersData);

          if (Array.isArray(landOfficersData)) {
            setLandOfficers(landOfficersData.map(officer => ({
              id: officer._id,
              name: officer.fullName,
              email: officer.email,
              assignedApplications: 0, // Will be calculated when assignment data is available
              completedApplications: 0
            })));
          } else {
            console.warn('Land officers data is not an array:', landOfficersData);
            setLandOfficers([]);
          }
        } catch (officerError) {
          console.error('Error fetching land officers:', officerError);
          toast.error('Failed to load land officers');
          setLandOfficers([]);
        }

        // Set recent activities (empty for now, will be populated when activity log API is available)
        setRecentActivities([]);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-[70vh]">Loading...</div>;
  }

  if (!authUser || authUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="mb-6">You need to be logged in as an Administrator to view this page.</p>
        <Link to="/login" className="btn-primary px-6 py-2 rounded-md">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Welcome, {authUser.fullName || 'Administrator'}</h2>
            <p className="text-gray-600">Manage the property registration system</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-1" />
              Refresh
            </button>
            <Link
              to="/admin/users"
              className="btn-primary px-4 py-2 rounded-md"
            >
              Manage Users
            </Link>
            <Link
              to="/admin/reports"
              className="bg-ethiopian-yellow text-gray-900 px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors"
            >
              View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Search */}
      <div className="mb-8">
        <DashboardSearch
          placeholder="Search users, properties, applications..."
          searchType="all"
          className="w-full"
        />
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Users</h3>
          <p className="text-3xl font-bold text-ethiopian-green">{stats.totalUsers}</p>
          <p className="text-gray-600 mt-1">Total registered users</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Properties</h3>
          <p className="text-3xl font-bold text-ethiopian-yellow">{stats.totalProperties}</p>
          <p className="text-gray-600 mt-1">Total registered properties</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Applications</h3>
          <p className="text-3xl font-bold text-ethiopian-red">{stats.pendingApplications}</p>
          <p className="text-gray-600 mt-1">Pending applications</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Revenue (This Month)</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.revenueThisMonth)}</p>
          <p className="text-gray-600 mt-1">
            {stats.revenueThisMonth > stats.revenueLastMonth ? (
              <span className="text-green-600">↑ {Math.round((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth * 100)}%</span>
            ) : (
              <span className="text-red-600">↓ {Math.round((stats.revenueLastMonth - stats.revenueThisMonth) / stats.revenueLastMonth * 100)}%</span>
            )}
            {' '}from last month
          </p>
        </div>
      </div>

      {/* Recent Activities and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <RecentActivity
            limit={8}
            showFilters={true}
            showHeader={true}
            className=""
          />
        </div>

        {/* Land Officers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Land Officers</h3>
          <div className="space-y-4">
            {landOfficers.map((officer) => (
              <div key={officer.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{officer.name}</h4>
                    <p className="text-gray-600 text-sm">{officer.email}</p>
                  </div>
                  <Link to={`/admin/users/${officer.id}`} className="text-ethiopian-green text-sm hover:underline">
                    View
                  </Link>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Assigned</p>
                    <p className="font-semibold">{officer.assignedApplications}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Completed</p>
                    <p className="font-semibold">{officer.completedApplications}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link to="/admin/land-officers" className="text-ethiopian-green hover:underline">
              Manage Land Officers
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users/new"
            className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors"
          >
            <div className="w-12 h-12 bg-ethiopian-green bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <span className="text-ethiopian-green text-xl">👤</span>
            </div>
            <h4 className="font-medium">Add New User</h4>
            <p className="text-gray-600 text-sm">Create user accounts</p>
          </Link>

          <Link
            to="/admin/properties"
            className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors"
          >
            <div className="w-12 h-12 bg-ethiopian-yellow bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <span className="text-ethiopian-yellow text-xl">📝</span>
            </div>
            <h4 className="font-medium">Review Properties</h4>
            <p className="text-gray-600 text-sm">Manage pending properties</p>
          </Link>

          <Link
            to="/admin/payments"
            className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors"
          >
            <div className="w-12 h-12 bg-ethiopian-red bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <span className="text-ethiopian-red text-xl">💰</span>
            </div>
            <h4 className="font-medium">Verify Payments</h4>
            <p className="text-gray-600 text-sm">Process pending payments</p>
          </Link>

          <Link
            to="/admin/reports"
            className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors"
          >
            <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-full flex items-center justify-center mb-2">
              <span className="text-blue-500 text-xl">📊</span>
            </div>
            <h4 className="font-medium">Generate Reports</h4>
            <p className="text-gray-600 text-sm">Create system reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

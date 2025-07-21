import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  HomeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user: authUser } = useAuth();

  // Quick action items for the dashboard
  const quickActions = [
    {
      title: 'Add New Land Officer',
      description: 'Create new landofficer account and manage user registrations',
      icon: <UserGroupIcon className="h-8 w-8" />,
      path: '/admin/users/new',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Review Properties',
      description: 'Review property registration applications',
      icon: <HomeIcon className="h-8 w-8" />,
      path: '/admin/properties',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'manage disputes',
      description: 'Manage and resolve property disputes',
      icon: <CurrencyDollarIcon className="h-8 w-8" />,
      path: '/admin/disputes',
      color: 'from-yellow-500 to-yellow-600',
      hoverColor: 'hover:from-yellow-600 hover:to-yellow-700',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Generate Reports',
      description: 'Generate system reports and analytics',
      icon: <ChartBarIcon className="h-8 w-8" />,
      path: '/admin/reports',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];


  // Access control check
  if (!authUser || authUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="mb-6">You need to be logged in as an Administrator to view this page.</p>
        <Link to="/admin-login" className="btn-primary px-6 py-2 rounded-md">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-primary">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-xl text-gray-600">
                Welcome back, <span className="font-semibold text-primary">{authUser.fullName || 'Administrator'}</span>
              </p>
              <p className="text-gray-500 mt-1">
                Manage your land registry system efficiently
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-lg shadow-md">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">System Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="group transform transition-all duration-300 hover:scale-105"
            >
              <div className={`bg-gradient-to-br ${action.color} ${action.hoverColor} rounded-xl shadow-lg p-6 text-white relative overflow-hidden transition-all duration-300 group-hover:shadow-2xl`}>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
                  <div className="w-24 h-24 rounded-full bg-white"></div>
                </div>

                {/* Icon */}
                <div className={`${action.iconBg} ${action.iconColor} w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {action.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                  {action.title}
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  {action.description}
                </p>

                {/* Arrow Icon */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Additional Information Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              System Management Hub
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Use the quick actions above to efficiently manage your land registry system.
              Each action provides direct access to the most important administrative functions.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-4">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">User Management</h3>
              <p className="text-sm text-gray-600">Create and manage landofficer accounts with role-based access control</p>
            </div>

            <div className="text-center p-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <HomeIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Property Review</h3>
              <p className="text-sm text-gray-600">Review property registration applications</p>
            </div>

            <div className="text-center p-4">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Analytics & Reports</h3>
              <p className="text-sm text-gray-600">Generate comprehensive reports and system analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

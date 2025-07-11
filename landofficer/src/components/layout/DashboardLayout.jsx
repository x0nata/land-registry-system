import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import GlobalSearch from '../search/GlobalSearch';
import NotificationBell from '../common/NotificationBell';
import {
  HomeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  PlusCircleIcon,
  UserCircleIcon,
  DocumentMagnifyingGlassIcon,
  MapIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowRightCircleIcon
} from '@heroicons/react/24/outline';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      {
        name: 'Dashboard',
        icon: <HomeIcon className="w-5 h-5" />,
        path: user?.role === 'landOfficer' ? '/landofficer/dashboard' :
              user?.role === 'admin' ? '/admin/dashboard' :
              '/dashboard/user'
      }
    ];

    // User-specific navigation items
    if (user?.role === 'user') {
      return [
        ...commonItems,
        {
          name: 'Register Property',
          icon: <PlusCircleIcon className="w-5 h-5" />,
          path: '/property/register'
        },
        {
          name: 'My Properties',
          icon: <HomeIcon className="w-5 h-5" />,
          path: '/properties'
        },

        {
          name: 'Payments',
          icon: <CurrencyDollarIcon className="w-5 h-5" />,
          path: '/payments'
        },
        {
          name: 'Notifications',
          icon: <BellIcon className="w-5 h-5" />,
          path: '/notifications'
        },
        {
          name: 'Profile',
          icon: <UserCircleIcon className="w-5 h-5" />,
          path: '/profile'
        }
      ];
    }

    // Land Officer-specific navigation items
    if (user?.role === 'landOfficer') {
      return [
        ...commonItems,
        {
          name: 'Property Verification',
          icon: <DocumentMagnifyingGlassIcon className="w-5 h-5" />,
          path: '/landofficer/property-verification'
        },
        {
          name: 'Document Validation',
          icon: <DocumentTextIcon className="w-5 h-5" />,
          path: '/landofficer/document-validation'
        },
        {
          name: 'Payment Verification',
          icon: <CurrencyDollarIcon className="w-5 h-5" />,
          path: '/landofficer/payment-verification'
        },
        {
          name: 'Reports',
          icon: <ChartBarIcon className="w-5 h-5" />,
          path: '/landofficer/reports'
        },
        {
          name: 'Profile',
          icon: <UserCircleIcon className="w-5 h-5" />,
          path: '/landofficer/profile'
        }
      ];
    }

    // Admin-specific navigation items
    if (user?.role === 'admin') {
      return [
        ...commonItems,
        {
          name: 'Users',
          icon: <UserGroupIcon className="w-5 h-5" />,
          path: '/admin/users'
        },
        {
          name: 'Properties',
          icon: <DocumentTextIcon className="w-5 h-5" />,
          path: '/admin/properties'
        },
        {
          name: 'Land Officers',
          icon: <UserGroupIcon className="w-5 h-5" />,
          path: '/admin/land-officers'
        },
        {
          name: 'Dispute Management',
          icon: <ExclamationTriangleIcon className="w-5 h-5" />,
          path: '/admin/disputes'
        },
        {
          name: 'Transfer Management',
          icon: <ArrowRightCircleIcon className="w-5 h-5" />,
          path: '/admin/transfers'
        },
        {
          name: 'Reports',
          icon: <ChartBarIcon className="w-5 h-5" />,
          path: '/admin/reports'
        },
        {
          name: 'Settings',
          icon: <Cog6ToothIcon className="w-5 h-5" />,
          path: '/admin/settings'
        }
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-primary-dark">
          <Link to="/" className="text-xl font-bold">
            Land Registry
          </Link>
          <button
            className="p-1 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 py-6">
          <div className="mb-8">
            <div className="text-sm opacity-75">Logged in as</div>
            <div className="font-semibold">{user?.fullName || 'User'}</div>
            <div className="text-sm opacity-75 capitalize">{user?.role || 'user'}</div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-white text-primary'
                    : 'text-white hover:bg-primary-dark'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-md text-white hover:bg-primary-dark transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
              Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b">
          <div className="flex items-center">
            <button
              className="p-1 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-primary mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Global Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Search everything...</span>
              <span className="sm:hidden">Search</span>
              <kbd className="hidden sm:inline-flex ml-2 px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 hidden md:block">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>

            {/* Notifications */}
            <NotificationBell />

            {/* User Profile */}
            <div className="relative">
              <button className="flex items-center focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;

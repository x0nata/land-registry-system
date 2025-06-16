import { useState, useEffect, useRef } from 'react';
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
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileDropdownOpen(false);
  };

  // Toggle profile dropdown
  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  // Get navigation items for users only
  const getNavItems = () => {
    return [
      {
        name: 'Dashboard',
        icon: <HomeIcon className="w-5 h-5" />,
        path: '/dashboard/user'
      },
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
            <div className="relative" ref={profileDropdownRef}>
              <button
                className="flex items-center space-x-2 focus:outline-none hover:bg-gray-100 rounded-md p-1 transition-colors"
                onClick={toggleProfileDropdown}
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-gray-600 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <UserCircleIcon className="w-4 h-4 inline mr-2" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeftOnRectangleIcon className="w-4 h-4 inline mr-2" />
                    Logout
                  </button>
                </div>
              )}
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

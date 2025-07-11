import { useEffect } from 'react';
import {
  CheckCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const AuthPopups = ({
  showLoginSuccess,
  showLogoutSuccess,
  user
}) => {

  // Auto-hide success popups after 3 seconds
  useEffect(() => {
    if (showLoginSuccess || showLogoutSuccess) {
      const timer = setTimeout(() => {
        // These will be handled by parent component
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showLoginSuccess, showLogoutSuccess]);

  return (
    <>
      {/* Login Success Popup */}
      {showLoginSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md pointer-events-auto border border-green-200 animate-bounce-in">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome Back!
                </h3>
                <p className="text-gray-600 mb-4">
                  You have successfully logged in as <span className="font-medium text-green-600">{user?.fullName}</span>
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <UserIcon className="h-4 w-4" />
                  <span className="capitalize">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Logout Success Popup */}
      {showLogoutSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md pointer-events-auto border border-blue-200 animate-bounce-in">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Logged Out Successfully
                </h3>
                <p className="text-gray-600">
                  You have been safely logged out. Thank you for using our service!
                </p>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default AuthPopups;

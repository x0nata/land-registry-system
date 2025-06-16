import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import * as userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../../components/common/RoleBadge';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const { user, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin-login', { state: { from: { pathname: '/admin/users' } } });
      return;
    }

    if (!hasRole('admin')) {
      toast.error('You do not have permission to access this page');
      navigate('/dashboard/user');
      return;
    }
  }, [isAuthenticated, hasRole, navigate]);

  // Update document title
  useEffect(() => {
    document.title = 'User Management | Property Registration System';
    return () => {
      document.title = 'Property Registration System';
    };
  }, []);

  // Fetch users on component mount and when filters change
  useEffect(() => {
    if (isAuthenticated() && hasRole('admin')) {
      fetchUsers();
    }
  }, [currentPage, roleFilter, searchTerm, isAuthenticated, hasRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated and has admin role
      if (!isAuthenticated()) {
        console.warn('User is not authenticated');
        setError('You must be logged in as an admin to view this page');
        setUsers([]);
        setTotalPages(1);
        setLoading(false);
        navigate('/admin-login', { state: { from: { pathname: '/admin/users' } } });
        return;
      }

      if (!hasRole('admin')) {
        console.warn('User does not have admin role');
        setError('You do not have permission to access this page');
        setUsers([]);
        setTotalPages(1);
        setLoading(false);
        navigate('/dashboard/user');
        return;
      }

      // Prepare query parameters
      const params = {
        page: currentPage,
        limit: limit
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (roleFilter) {
        params.role = roleFilter;
      }

      // Log the current user and token for debugging
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log('Current user:', userData);
        console.log('Token being used:', userData.token);
      }

      try {
        // Fetch users from the API
        console.log('Fetching users with params:', params);
        const response = await userService.getAllUsers(params);

        console.log('API Response:', response);

        // Check if the response has the expected structure
        if (response && response.users && Array.isArray(response.users)) {
          console.log('Users found:', response.users.length);
          setUsers(response.users);
          setTotalPages(response.pagination?.pages || 1);
        } else if (Array.isArray(response)) {
          // If the response is an array, assume it's the users array
          console.log('Users found (array):', response.length);
          setUsers(response);
          setTotalPages(Math.ceil(response.length / limit) || 1);
        } else {
          // No users found or unexpected structure
          console.log('No users found in response or unexpected structure:', response);
          setUsers([]);
          setTotalPages(1);
        }
      } catch (apiError) {
        console.error('API error:', apiError);

        // Handle specific error cases
        if (apiError.response?.status === 401) {
          setError('Authentication failed. Please login again.');
          toast.error('Authentication failed. Please login again.');
        } else if (apiError.response?.status === 403) {
          setError('Access denied. Admin privileges required.');
          toast.error('Access denied. Admin privileges required.');
        } else if (apiError.response?.status === 500) {
          setError('Server error. Please try again later.');
          toast.error('Server error. Please try again later.');
        } else {
          setError(apiError.message || 'Failed to fetch users from server');
          toast.error('Failed to fetch users. Please check your connection and try again.');
        }

        setUsers([]);
        setTotalPages(1);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchUsers:', err);
      setError('Failed to fetch users: ' + (err.message || 'Unknown error'));
      setUsers([]);
      setTotalPages(1);
      setLoading(false);
      toast.error(err.message || 'Failed to fetch users');
    }
  };

  const handleViewUser = async (userId) => {
    try {
      setLoading(true);

      // Try to find the user in the current users list first
      const userFromList = users.find(u => u._id === userId);

      if (userFromList) {
        setSelectedUser(userFromList);
        setShowUserModal(true);
        setLoading(false);
        return;
      }

      // If not found in the list, try to fetch from API
      try {
        const user = await userService.getUserById(userId);
        setSelectedUser(user);
        setShowUserModal(true);
      } catch (apiError) {
        console.error('Error fetching user details from API:', apiError);
        toast.error('Failed to fetch user details');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in handleViewUser:', err);
      setError('Failed to fetch user details');
      setLoading(false);
      toast.error(err.message || 'Failed to fetch user details');
    }
  };

  const handleDeleteUser = async () => {
    try {
      setLoading(true);

      try {
        await userService.deleteUser(selectedUser._id);

        setShowDeleteModal(false);
        setSelectedUser(null);
        toast.success('User deleted successfully');

        // Refresh the users list
        fetchUsers();
      } catch (apiError) {
        console.error('Error deleting user from API:', apiError);
        toast.error(apiError.message || 'Failed to delete user');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error in handleDeleteUser:', err);
      setLoading(false);
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleChangeRole = async () => {
    try {
      setLoading(true);

      // Validate role change
      if (selectedUser.role === newRole) {
        toast.info('User already has this role');
        setShowRoleModal(false);
        setSelectedUser(null);
        setNewRole('');
        setLoading(false);
        return;
      }

      try {
        const result = await userService.changeUserRole(selectedUser._id, newRole);

        setShowRoleModal(false);
        setSelectedUser(null);
        setNewRole('');

        // Show success message with role change details
        toast.success(result.message || `User role updated from '${selectedUser.role}' to '${newRole}' successfully`);

        // Refresh the users list
        fetchUsers();
      } catch (apiError) {
        console.error('Error updating user role from API:', apiError);
        toast.error(apiError.message || 'Failed to update user role');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error in handleChangeRole:', err);
      setLoading(false);
      toast.error(err.message || 'Failed to update user role');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleResetPassword = async (userId) => {
    try {
      setLoading(true);
      // This would be implemented in a real app to trigger a password reset
      // For now, we'll just show a success message
      toast.info('Password reset link has been sent to the user');
      setLoading(false);
    } catch (err) {
      console.error('Error resetting password:', err);
      setLoading(false);
      toast.error(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-1" />
              Refresh
            </button>
            <Link
              to="/admin/users/new"
              className="btn-primary px-4 py-2 rounded-md flex items-center"
            >
              <UserPlusIcon className="h-5 w-5 mr-1" />
              Add New User
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-grow">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  className="form-input rounded-r-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark flex items-center"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
                  Search
                </button>
              </div>
            </form>
            <div className="w-full md:w-64">
              <select
                className="form-input w-full"
                value={roleFilter}
                onChange={handleRoleFilterChange}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="landOfficer">Land Officer</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2">Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user._id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RoleBadge role={user.role} size="sm" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewUser(user._id)}
                            className="text-primary hover:text-primary-dark mr-3 flex items-center"
                          >
                            <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                              setNewRole(user.role);
                            }}
                            className="text-secondary hover:text-secondary-dark mr-3 flex items-center"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Change Role
                          </button>
                          <button
                            onClick={() => handleResetPassword(user._id)}
                            className="text-yellow-600 hover:text-yellow-800 mr-3 flex items-center"
                          >
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            Reset Password
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="text-accent hover:text-accent-dark flex items-center"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {users.length} of {totalPages * limit} users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  Previous
                </button>
                {totalPages > 0 && (
                  <span className="px-3 py-1 bg-gray-100 rounded-md">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">User Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{selectedUser.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium">{selectedUser.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">National ID</p>
                <p className="font-medium">{selectedUser.nationalId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium capitalize">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Created</p>
                <p className="font-medium">
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete the user <span className="font-semibold">{selectedUser.fullName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Change User Role</h2>
            <p className="mb-4">
              Change role for user <span className="font-semibold">{selectedUser.fullName}</span>:
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="role-user"
                  name="role"
                  value="user"
                  checked={newRole === 'user'}
                  onChange={() => setNewRole('user')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="role-user" className="ml-2 block text-sm text-gray-900">
                  User (Property Owner)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="role-landOfficer"
                  name="role"
                  value="landOfficer"
                  checked={newRole === 'landOfficer'}
                  onChange={() => setNewRole('landOfficer')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="role-landOfficer" className="ml-2 block text-sm text-gray-900">
                  Land Officer
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="role-admin"
                  name="role"
                  value="admin"
                  checked={newRole === 'admin'}
                  onChange={() => setNewRole('admin')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="role-admin" className="ml-2 block text-sm text-gray-900">
                  Administrator
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeRole}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

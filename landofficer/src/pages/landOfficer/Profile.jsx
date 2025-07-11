import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  UserCircleIcon,
  KeyIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    department: '',
    position: '',
    joinDate: '',
    address: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // In a real app, this would fetch the user profile from an API
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      setProfileData({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: '',
        employeeId: '',
        department: '',
        position: '',
        joinDate: '',
        address: ''
      });
      setLoading(false);
    }, 1000);
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setLoading(true);

    // In a real app, this would make an API call to update the profile
    // For now, we'll simulate a successful update
    setTimeout(() => {
      setIsEditing(false);
      setLoading(false);
      toast.success('Profile updated successfully');
    }, 1000);
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);

    // In a real app, this would make an API call to update the password
    // For now, we'll simulate a successful update
    setTimeout(() => {
      setChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setLoading(false);
      toast.success('Password updated successfully');
    }, 1000);
  };

  if (loading && !profileData.fullName) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>
          <div className="mt-4 md:mt-0">
            {!isEditing && !changePassword && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {!changePassword ? (
          <div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <UserCircleIcon className="w-24 h-24 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-semibold">{profileData.fullName}</h2>
                  <p className="text-gray-600">{profileData.position}</p>
                  <p className="text-sm text-gray-500">{profileData.department}</p>

                  {!isEditing && (
                    <button
                      onClick={() => setChangePassword(true)}
                      className="mt-6 px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition-colors flex items-center"
                    >
                      <KeyIcon className="w-4 h-4 mr-2" />
                      Change Password
                    </button>
                  )}
                </div>
              </div>

              <div className="md:w-2/3">
                {isEditing ? (
                  <form onSubmit={handleProfileUpdate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="fullName" className="form-label">Full Name</label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          className="form-input"
                          value={profileData.fullName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-input"
                          value={profileData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-input"
                          value={profileData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="address" className="form-label">Address</label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          className="form-input"
                          value={profileData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-6 space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{profileData.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <div className="flex items-center">
                          <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <p className="font-medium">{profileData.email}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <div className="flex items-center">
                          <PhoneIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <p className="font-medium">{profileData.phone}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{profileData.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Employee ID</p>
                        <div className="flex items-center">
                          <IdentificationIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <p className="font-medium">{profileData.employeeId}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <p className="font-medium">{profileData.department}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Position</p>
                        <p className="font-medium">{profileData.position}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Join Date</p>
                        <p className="font-medium">{new Date(profileData.joinDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div className="mb-4">
                <label htmlFor="currentPassword" className="form-label">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  className="form-input"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="newPassword" className="form-label">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className="form-input"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength="8"
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
              </div>
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setChangePassword(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

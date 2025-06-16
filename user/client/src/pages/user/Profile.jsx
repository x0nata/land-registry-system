import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Personal Information validation schema
  const personalInfoSchema = Yup.object({
    fullName: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().required('Phone number is required'),
    address: Yup.string().required('Address is required')
  });
  
  // Password change validation schema
  const passwordChangeSchema = Yup.object({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      )
      .required('New password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
      .required('Confirm password is required')
  });
  
  // Handle personal information update
  const handlePersonalInfoUpdate = async (values, { setSubmitting }) => {
    try {
      // In a real app, this would make an API call to update user information
      // For now, we'll simulate a successful update
      
      // Show success message
      toast.success('Personal information updated successfully');
    } catch (error) {
      toast.error('Failed to update personal information');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (values, { setSubmitting, resetForm }) => {
    try {
      // In a real app, this would make an API call to change password
      // For now, we'll simulate a successful password change
      
      // Show success message
      toast.success('Password changed successfully');
      
      // Close modal and reset form
      setShowPasswordModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle notification settings update
  const handleNotificationSettingsUpdate = async (values, { setSubmitting }) => {
    try {
      // In a real app, this would make an API call to update notification settings
      // For now, we'll simulate a successful update
      
      // Show success message
      toast.success('Notification settings updated successfully');
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-700">You need to be logged in to view this page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">User Profile</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'personal'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Information
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
          </nav>
        </div>
        
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div>
            <Formik
              initialValues={{
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
              }}
              validationSchema={personalInfoSchema}
              onSubmit={handlePersonalInfoUpdate}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="form-label">
                      Full Name
                    </label>
                    <Field
                      type="text"
                      id="fullName"
                      name="fullName"
                      className="form-input"
                    />
                    <ErrorMessage name="fullName" component="div" className="form-error" />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                    />
                    <ErrorMessage name="email" component="div" className="form-error" />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <Field
                      type="text"
                      id="phone"
                      name="phone"
                      className="form-input"
                    />
                    <ErrorMessage name="phone" component="div" className="form-error" />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="form-label">
                      Address
                    </label>
                    <Field
                      type="text"
                      id="address"
                      name="address"
                      className="form-input"
                    />
                    <ErrorMessage name="address" component="div" className="form-error" />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}
        
        {/* Security Tab */}
        {activeTab === 'security' && (
          <div>
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-4">Password</h2>
              <p className="text-gray-600 mb-4">
                Your password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.
              </p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Change Password
              </button>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Account Activity</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">Last Login</p>
                  <p className="font-medium">May 15, 2023, 10:30 AM</p>
                </div>
                <div>
                  <p className="text-gray-600">Login Location</p>
                  <p className="font-medium">Addis Ababa, Ethiopia</p>
                </div>
                <div>
                  <p className="text-gray-600">Device</p>
                  <p className="font-medium">Chrome on Windows</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            <Formik
              initialValues={{
                emailNotifications: true,
                smsNotifications: false,
                applicationUpdates: true,
                documentVerification: true,
                paymentReminders: true,
                systemAnnouncements: false
              }}
              onSubmit={handleNotificationSettingsUpdate}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h2 className="text-lg font-semibold mb-4">Notification Channels</h2>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="emailNotifications"
                          name="emailNotifications"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                          Email Notifications
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="smsNotifications"
                          name="smsNotifications"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="smsNotifications" className="ml-2 block text-sm text-gray-900">
                          SMS Notifications
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">Notification Types</h2>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="applicationUpdates"
                          name="applicationUpdates"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="applicationUpdates" className="ml-2 block text-sm text-gray-900">
                          Application Status Updates
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="documentVerification"
                          name="documentVerification"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="documentVerification" className="ml-2 block text-sm text-gray-900">
                          Document Verification Results
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="paymentReminders"
                          name="paymentReminders"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="paymentReminders" className="ml-2 block text-sm text-gray-900">
                          Payment Reminders and Confirmations
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="systemAnnouncements"
                          name="systemAnnouncements"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="systemAnnouncements" className="ml-2 block text-sm text-gray-900">
                          System Announcements and Updates
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}
      </div>
      
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            
            <Formik
              initialValues={{
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              }}
              validationSchema={passwordChangeSchema}
              onSubmit={handlePasswordChange}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="form-label">
                      Current Password
                    </label>
                    <Field
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      className="form-input"
                    />
                    <ErrorMessage name="currentPassword" component="div" className="form-error" />
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <Field
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      className="form-input"
                    />
                    <ErrorMessage name="newPassword" component="div" className="form-error" />
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <Field
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className="form-input"
                    />
                    <ErrorMessage name="confirmPassword" component="div" className="form-error" />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                    >
                      {isSubmitting ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

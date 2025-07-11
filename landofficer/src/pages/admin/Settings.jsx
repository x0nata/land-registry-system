import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  Cog6ToothIcon,
  BellIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import * as settingsService from '../../services/settingsService';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch settings from API
      const settingsData = await settingsService.getSystemSettings();
      setSettings(settingsData);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to fetch system settings');
      toast.error('Failed to fetch system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (values, { setSubmitting }) => {
    try {
      // Update settings via API
      const updatedSettings = await settingsService.updateSystemSettings(values);

      // Update local state
      setSettings(updatedSettings);
      toast.success('Settings updated successfully');
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  // Validation schemas for different settings sections
  const generalValidationSchema = Yup.object({
    systemName: Yup.string().required('System name is required'),
    contactEmail: Yup.string().email('Invalid email address').required('Contact email is required'),
    contactPhone: Yup.string().required('Contact phone is required'),
    maintenanceMode: Yup.boolean()
  });

  const feesValidationSchema = Yup.object({
    registrationFee: Yup.number().positive('Must be a positive number').required('Registration fee is required'),
    documentVerificationFee: Yup.number().positive('Must be a positive number').required('Document verification fee is required'),
    transferFee: Yup.number().positive('Must be a positive number').required('Transfer fee is required'),
    certificateIssueFee: Yup.number().positive('Must be a positive number').required('Certificate issue fee is required')
  });

  const notificationValidationSchema = Yup.object({
    emailNotifications: Yup.boolean(),
    smsNotifications: Yup.boolean(),
    applicationStatusChangeNotify: Yup.boolean(),
    documentVerificationNotify: Yup.boolean(),
    paymentConfirmationNotify: Yup.boolean()
  });

  const securityValidationSchema = Yup.object({
    passwordMinLength: Yup.number().min(6, 'Minimum length should be at least 6').required('Password minimum length is required'),
    passwordRequireSpecialChar: Yup.boolean(),
    passwordRequireNumber: Yup.boolean(),
    sessionTimeout: Yup.number().positive('Must be a positive number').required('Session timeout is required'),
    maxLoginAttempts: Yup.number().positive('Must be a positive number').required('Max login attempts is required')
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <Cog6ToothIcon className="h-7 w-7 mr-2 text-primary" />
          System Settings
        </h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2">Loading settings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : settings ? (
          <div>
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex -mb-px">
                <button
                  className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'general'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('general')}
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-1" />
                  General
                </button>
                <button
                  className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'fees'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('fees')}
                >
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  Fees & Payments
                </button>
                <button
                  className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'notifications'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <BellIcon className="h-4 w-4 mr-1" />
                  Notifications
                </button>
                <button
                  className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'security'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('security')}
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  Security
                </button>
              </nav>
            </div>

            {/* General Settings */}
            {activeTab === 'general' && (
              <Formik
                initialValues={{
                  systemName: settings.systemName || '',
                  contactEmail: settings.contactEmail || '',
                  contactPhone: settings.contactPhone || '',
                  maintenanceMode: settings.maintenanceMode || false
                }}
                validationSchema={generalValidationSchema}
                onSubmit={handleUpdateSettings}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div>
                      <label htmlFor="systemName" className="form-label">
                        System Name
                      </label>
                      <Field
                        type="text"
                        id="systemName"
                        name="systemName"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="systemName"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div>
                      <label htmlFor="contactEmail" className="form-label">
                        Contact Email
                      </label>
                      <Field
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="contactEmail"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div>
                      <label htmlFor="contactPhone" className="form-label">
                        Contact Phone
                      </label>
                      <Field
                        type="text"
                        id="contactPhone"
                        name="contactPhone"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="contactPhone"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div className="flex items-center">
                      <Field
                        type="checkbox"
                        id="maintenanceMode"
                        name="maintenanceMode"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                        Maintenance Mode
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary px-4 py-2 rounded-md flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5 mr-1" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}

            {/* Fees & Payments Settings */}
            {activeTab === 'fees' && (
              <Formik
                initialValues={{
                  registrationFee: settings.registrationFee || 0,
                  documentVerificationFee: settings.documentVerificationFee || 0,
                  transferFee: settings.transferFee || 0,
                  certificateIssueFee: settings.certificateIssueFee || 0
                }}
                validationSchema={feesValidationSchema}
                onSubmit={handleUpdateSettings}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div>
                      <label htmlFor="registrationFee" className="form-label">
                        Registration Fee (ETB)
                      </label>
                      <Field
                        type="number"
                        id="registrationFee"
                        name="registrationFee"
                        className="form-input"
                        min="0"
                        step="0.01"
                      />
                      <ErrorMessage
                        name="registrationFee"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div>
                      <label htmlFor="documentVerificationFee" className="form-label">
                        Document Verification Fee (ETB)
                      </label>
                      <Field
                        type="number"
                        id="documentVerificationFee"
                        name="documentVerificationFee"
                        className="form-input"
                        min="0"
                        step="0.01"
                      />
                      <ErrorMessage
                        name="documentVerificationFee"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div>
                      <label htmlFor="transferFee" className="form-label">
                        Transfer Fee (ETB)
                      </label>
                      <Field
                        type="number"
                        id="transferFee"
                        name="transferFee"
                        className="form-input"
                        min="0"
                        step="0.01"
                      />
                      <ErrorMessage
                        name="transferFee"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div>
                      <label htmlFor="certificateIssueFee" className="form-label">
                        Certificate Issue Fee (ETB)
                      </label>
                      <Field
                        type="number"
                        id="certificateIssueFee"
                        name="certificateIssueFee"
                        className="form-input"
                        min="0"
                        step="0.01"
                      />
                      <ErrorMessage
                        name="certificateIssueFee"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary px-4 py-2 rounded-md flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5 mr-1" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <Formik
                initialValues={{
                  emailNotifications: settings.emailNotifications || false,
                  smsNotifications: settings.smsNotifications || false,
                  applicationStatusChangeNotify: settings.applicationStatusChangeNotify || false,
                  documentVerificationNotify: settings.documentVerificationNotify || false,
                  paymentConfirmationNotify: settings.paymentConfirmationNotify || false
                }}
                validationSchema={notificationValidationSchema}
                onSubmit={handleUpdateSettings}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notification Channels</h3>
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="emailNotifications"
                          name="emailNotifications"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                          Enable Email Notifications
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
                          Enable SMS Notifications
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notification Events</h3>
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="applicationStatusChangeNotify"
                          name="applicationStatusChangeNotify"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="applicationStatusChangeNotify" className="ml-2 block text-sm text-gray-900">
                          Application Status Changes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="documentVerificationNotify"
                          name="documentVerificationNotify"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="documentVerificationNotify" className="ml-2 block text-sm text-gray-900">
                          Document Verification
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="paymentConfirmationNotify"
                          name="paymentConfirmationNotify"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="paymentConfirmationNotify" className="ml-2 block text-sm text-gray-900">
                          Payment Confirmations
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary px-4 py-2 rounded-md flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5 mr-1" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <Formik
                initialValues={{
                  passwordMinLength: settings.passwordMinLength || 8,
                  passwordRequireSpecialChar: settings.passwordRequireSpecialChar || false,
                  passwordRequireNumber: settings.passwordRequireNumber || false,
                  sessionTimeout: settings.sessionTimeout || 30,
                  maxLoginAttempts: settings.maxLoginAttempts || 5
                }}
                validationSchema={securityValidationSchema}
                onSubmit={handleUpdateSettings}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div>
                      <label htmlFor="passwordMinLength" className="form-label">
                        Minimum Password Length
                      </label>
                      <Field
                        type="number"
                        id="passwordMinLength"
                        name="passwordMinLength"
                        className="form-input"
                        min="6"
                      />
                      <ErrorMessage
                        name="passwordMinLength"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div className="flex items-center">
                      <Field
                        type="checkbox"
                        id="passwordRequireSpecialChar"
                        name="passwordRequireSpecialChar"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="passwordRequireSpecialChar" className="ml-2 block text-sm text-gray-900">
                        Require Special Character in Password
                      </label>
                    </div>

                    <div className="flex items-center">
                      <Field
                        type="checkbox"
                        id="passwordRequireNumber"
                        name="passwordRequireNumber"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="passwordRequireNumber" className="ml-2 block text-sm text-gray-900">
                        Require Number in Password
                      </label>
                    </div>

                    <div>
                      <label htmlFor="sessionTimeout" className="form-label">
                        Session Timeout (minutes)
                      </label>
                      <Field
                        type="number"
                        id="sessionTimeout"
                        name="sessionTimeout"
                        className="form-input"
                        min="1"
                      />
                      <ErrorMessage
                        name="sessionTimeout"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div>
                      <label htmlFor="maxLoginAttempts" className="form-label">
                        Maximum Login Attempts
                      </label>
                      <Field
                        type="number"
                        id="maxLoginAttempts"
                        name="maxLoginAttempts"
                        className="form-input"
                        min="1"
                      />
                      <ErrorMessage
                        name="maxLoginAttempts"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary px-4 py-2 rounded-md flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5 mr-1" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No settings found</div>
        )}
      </div>
    </div>
  );
};

export default Settings;

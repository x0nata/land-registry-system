import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  UserPlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import * as userService from '../../services/userService';
import RoleBadge from '../../components/common/RoleBadge';

const UserForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Validation schema
  const validationSchema = Yup.object({
    fullName: Yup.string()
      .required('Full name is required')
      .min(3, 'Full name must be at least 3 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters'),
    phoneNumber: Yup.string()
      .required('Phone number is required'),
    nationalId: Yup.string()
      .required('National ID is required')
      .matches(/^ETH[0-9A-Za-z]{9}$/, 'National ID must be 12 characters starting with ETH'),
    role: Yup.string()
      .required('Role is required')
      .oneOf(['admin', 'landOfficer', 'user'], 'Invalid role')
  });

  // Initial form values
  const initialValues = {
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    nationalId: '',
    role: 'user'
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoading(true);

      // Create user via API
      await userService.createUser(values);

      toast.success('User created successfully');
      resetForm();

      // Redirect to the appropriate page based on the user role
      if (values.role === 'landOfficer') {
        navigate('/admin/land-officers');
      } else {
        navigate('/admin/users');
      }

      setLoading(false);
      setSubmitting(false);
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error(err.message || 'Failed to create user');
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <UserPlusIcon className="h-7 w-7 mr-2 text-primary" />
            Add New User
          </h1>
          <Link
            to="/admin/users"
            className="text-primary hover:text-primary-dark flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Users
          </Link>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="form-label">
                    Full Name
                  </label>
                  <Field
                    type="text"
                    id="fullName"
                    name="fullName"
                    className={`form-input ${
                      errors.fullName && touched.fullName ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter full name"
                  />
                  <ErrorMessage
                    name="fullName"
                    component="div"
                    className="form-error"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <Field
                    type="email"
                    id="email"
                    name="email"
                    className={`form-input ${
                      errors.email && touched.email ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter email address"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="form-error"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <Field
                    type="password"
                    id="password"
                    name="password"
                    className={`form-input ${
                      errors.password && touched.password ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter password"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="form-error"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="form-label">
                    Phone Number
                  </label>
                  <Field
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    className={`form-input ${
                      errors.phoneNumber && touched.phoneNumber ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter phone number"
                  />
                  <ErrorMessage
                    name="phoneNumber"
                    component="div"
                    className="form-error"
                  />
                </div>

                <div>
                  <label htmlFor="nationalId" className="form-label">
                    National ID
                  </label>
                  <Field
                    type="text"
                    id="nationalId"
                    name="nationalId"
                    className={`form-input ${
                      errors.nationalId && touched.nationalId ? 'border-red-500' : ''
                    }`}
                    placeholder="ETH123456789"
                  />
                  <ErrorMessage
                    name="nationalId"
                    component="div"
                    className="form-error"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="role" className="form-label">
                    User Role
                  </label>
                  <Field name="role">
                    {({ field, form }) => (
                      <div className="space-y-3">
                        <select
                          {...field}
                          id="role"
                          className={`form-input ${
                            errors.role && touched.role ? 'border-red-500' : ''
                          }`}
                        >
                          <option value="user">User (Property Owner)</option>
                          <option value="landOfficer">Land Officer</option>
                          <option value="admin">Administrator</option>
                        </select>

                        {/* Role descriptions */}
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 mr-2">Selected Role:</span>
                            <RoleBadge role={field.value} size="sm" />
                          </div>
                          <div className="text-sm text-gray-600">
                            {field.value === 'user' && (
                              <p>Regular users can register properties, submit applications, and manage their own property portfolio.</p>
                            )}
                            {field.value === 'landOfficer' && (
                              <p>Land Officers can review property applications, verify documents, and approve or reject property registrations.</p>
                            )}
                            {field.value === 'admin' && (
                              <p>Administrators have full system access including user management, system settings, and all property operations.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Field>
                  <ErrorMessage
                    name="role"
                    component="div"
                    className="form-error"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <Link
                  to="/admin/users"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-gray-400 flex items-center"
                >
                  {isSubmitting || loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-1" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default UserForm;

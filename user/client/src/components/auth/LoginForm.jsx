import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const LoginForm = ({ onSuccess }) => {
  const { login } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [formValues, setFormValues] = useState(null);
  
  // Validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
  });
  
  // Handle form submission
  const handleSubmit = (values, { setSubmitting }) => {
    // Store form values for the modal
    setFormValues(values);
    
    // Show role selection modal
    setShowRoleModal(true);
    setSubmitting(false);
  };
  
  // Handle role selection and complete login
  const handleRoleSelection = async () => {
    try {
      // Call login function from auth context
      const result = await login(formValues.email, formValues.password, selectedRole);
      
      // Close modal
      setShowRoleModal(false);
      
      // Call onSuccess callback if provided
      if (onSuccess && result.success) {
        onSuccess(result.user);
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    }
  };
  
  return (
    <>
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <Field
                type="email"
                name="email"
                id="email"
                className="form-input"
                placeholder="your.email@example.com"
              />
              <ErrorMessage name="email" component="div" className="form-error" />
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <Field
                type="password"
                name="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
              />
              <ErrorMessage name="password" component="div" className="form-error" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-ethiopian-green focus:ring-ethiopian-green border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <a href="/forgot-password" className="text-ethiopian-green hover:text-ethiopian-green-dark">
                  Forgot your password?
                </a>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-2 px-4 rounded-md"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </Form>
        )}
      </Formik>
      
      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-semibold mb-4">Login as:</h3>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedRole('user')}
                className={`w-full p-3 rounded-md border ${
                  selectedRole === 'user'
                    ? 'bg-ethiopian-green text-white border-ethiopian-green'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                User (Property Owner)
              </button>
              <button
                onClick={() => setSelectedRole('landOfficer')}
                className={`w-full p-3 rounded-md border ${
                  selectedRole === 'landOfficer'
                    ? 'bg-ethiopian-green text-white border-ethiopian-green'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Land Officer
              </button>
              <button
                onClick={() => setSelectedRole('admin')}
                className={`w-full p-3 rounded-md border ${
                  selectedRole === 'admin'
                    ? 'bg-ethiopian-green text-white border-ethiopian-green'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Administrator
              </button>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleSelection}
                disabled={!selectedRole}
                className={`px-4 py-2 rounded-md ${
                  selectedRole
                    ? 'bg-ethiopian-green text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginForm;

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, isAuthenticated, user } = useAuth();
  const [loginError, setLoginError] = useState('');

  // Update document title
  useEffect(() => {
    document.title = 'Login | Property Registration System';
    return () => {
      document.title = 'Property Registration System';
    };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      // Only allow regular users
      if (user.role === 'user') {
        navigate('/dashboard/user');
      } else {
        // Block admin and land officer access
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Get redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard/user';

  // Validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required'),
    rememberMe: Yup.boolean()
  });

  // Handle login form submission
  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setLoginError('');
      // Use the auth context to log in with API
      const result = await login(values.email, values.password, values.rememberMe);

      if (result.success) {
        // Only allow regular users to access the system
        if (result.user.role === 'user') {
          navigate('/dashboard/user');
        } else {
          // Block admin and land officer access
          setLoginError('Access denied. This system is for registered users only.');
          // Logout the user immediately
          logout();
        }
      } else {
        setLoginError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Login failed. Please check your credentials.');
      if (error.message?.includes('email')) {
        setFieldError('email', error.message);
      } else if (error.message?.includes('password')) {
        setFieldError('password', error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Login to Your Account
        </h2>

        {loginError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{loginError}</p>
          </div>
        )}

        <Formik
          initialValues={{ email: '', password: '', rememberMe: false }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-6">
              <div>
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="relative">
                  <Field
                    type="email"
                    name="email"
                    id="email"
                    className={`form-input ${errors.email && touched.email ? 'border-red-500 pr-10' : ''}`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && touched.email && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                <ErrorMessage name="email" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <Field
                    type="password"
                    name="password"
                    id="password"
                    className={`form-input ${errors.password && touched.password ? 'border-red-500 pr-10' : ''}`}
                    placeholder="••••••••"
                  />
                  {errors.password && touched.password && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                <ErrorMessage name="password" component="div" className="form-error" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Field
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="text-primary hover:text-primary-dark">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-2 px-4 rounded-md flex justify-center items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : 'Login'}
              </button>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Register here
                  </Link>
                </p>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Login;

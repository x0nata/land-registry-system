import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import PasswordStrengthMeter from '../../components/auth/PasswordStrengthMeter';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [registrationError, setRegistrationError] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  // Update document title
  useEffect(() => {
    document.title = 'Register | Property Registration System';
    return () => {
      document.title = 'Property Registration System';
    };
  }, []);

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
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    phoneNumber: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9+\s-]+$/, 'Invalid phone number format'),
    nationalId: Yup.string()
      .required('National ID is required')
      .matches(/^ETH[0-9A-Za-z]{9}$/, 'National ID must be 12 characters starting with ETH'),
    agreeToTerms: Yup.boolean()
      .oneOf([true], 'You must agree to the terms and conditions')
      .required('You must agree to the terms and conditions')
  });

  // Handle registration form submission
  const handleSubmit = async (values, { setSubmitting, resetForm, setFieldError }) => {
    try {
      setRegistrationError('');

      // Create user object
      const userData = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        nationalId: values.nationalId,
        role: 'user'
      };

      console.log('Submitting registration data:', userData);

      // Call the register function from AuthContext
      const result = await register(userData);
      console.log('Registration result:', result);

      if (result.success) {
        // Reset form and password state
        resetForm();
        setPasswordValue('');

        // Show success message
        toast.success('Registration successful! You can now login.');

        // Redirect to login page
        setTimeout(() => {
          navigate('/login');
        }, 1500); // Short delay to allow the user to see the success message
      } else {
        console.error('Registration failed:', result.error);
        setRegistrationError(result.error || 'Registration failed. Please try again.');

        // Set field-specific errors if possible
        if (result.error?.includes('email')) {
          setFieldError('email', 'This email is already registered');
        } else if (result.error?.includes('National ID')) {
          setFieldError('nationalId', 'This National ID is already registered');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationError(error.message || 'Registration failed. Please try again.');

      // Set field-specific errors if possible
      if (error.message?.includes('email')) {
        setFieldError('email', 'This email is already registered');
      } else if (error.message?.includes('National ID')) {
        setFieldError('nationalId', 'This National ID is already registered');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Create an Account
        </h2>

        {registrationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{registrationError}</p>
          </div>
        )}

        <Formik
          initialValues={{
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            phoneNumber: '',
            nationalId: '',
            agreeToTerms: false
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, values, handleChange }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="fullName" className="form-label">
                  Full Name
                </label>
                <div className="relative">
                  <Field
                    type="text"
                    name="fullName"
                    id="fullName"
                    className={`form-input ${errors.fullName && touched.fullName ? 'border-red-500 pr-10' : ''}`}
                    placeholder="John Doe"
                  />
                  {errors.fullName && touched.fullName && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                <ErrorMessage name="fullName" component="div" className="form-error" />
              </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      onChange={(e) => {
                        handleChange(e);
                        setPasswordValue(e.target.value);
                      }}
                    />
                    {errors.password && touched.password && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  <ErrorMessage name="password" component="div" className="form-error" />
                  <PasswordStrengthMeter password={passwordValue} />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Field
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      className={`form-input ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500 pr-10' :
                        values.confirmPassword && values.password === values.confirmPassword ? 'border-green-500 pr-10' : ''}`}
                      placeholder="••••••••"
                    />
                    {errors.confirmPassword && touched.confirmPassword ? (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                      </div>
                    ) : values.confirmPassword && values.password === values.confirmPassword ? (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                    ) : null}
                  </div>
                  <ErrorMessage name="confirmPassword" component="div" className="form-error" />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="form-label">
                  Phone Number
                </label>
                <div className="relative">
                  <Field
                    type="text"
                    name="phoneNumber"
                    id="phoneNumber"
                    className={`form-input ${errors.phoneNumber && touched.phoneNumber ? 'border-red-500 pr-10' : ''}`}
                    placeholder="+251 91 234 5678"
                  />
                  {errors.phoneNumber && touched.phoneNumber && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                <ErrorMessage name="phoneNumber" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="nationalId" className="form-label">
                  National ID
                </label>
                <div className="relative">
                  <Field
                    type="text"
                    name="nationalId"
                    id="nationalId"
                    className={`form-input ${errors.nationalId && touched.nationalId ? 'border-red-500 pr-10' : ''}`}
                    placeholder="ETH123456789"
                  />
                  {errors.nationalId && touched.nationalId && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                <ErrorMessage name="nationalId" component="div" className="form-error" />
                <p className="text-gray-500 text-xs mt-1">
                  National ID must be 12 characters starting with ETH (e.g., ETH123456789)
                </p>
              </div>

              <div className="flex items-center mt-4">
                <Field
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms-of-service" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              <ErrorMessage name="agreeToTerms" component="div" className="form-error" />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-2 px-4 rounded-md mt-6 flex justify-center items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : 'Register'}
              </button>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Login here
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

export default Register;

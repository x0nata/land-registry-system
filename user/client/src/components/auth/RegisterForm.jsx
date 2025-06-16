import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const RegisterForm = ({ onSuccess }) => {
  const { register } = useAuth();
  
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
    termsAccepted: Yup.boolean()
      .required('You must accept the terms and conditions')
      .oneOf([true], 'You must accept the terms and conditions')
  });
  
  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Remove confirmPassword and termsAccepted from values
      const { confirmPassword, termsAccepted, ...userData } = values;
      
      // Call register function from auth context
      const result = await register(userData);
      
      if (result.success) {
        // Show success message
        toast.success('Registration successful! You can now login.');
        
        // Reset form
        resetForm();
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Formik
      initialValues={{
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        nationalId: '',
        termsAccepted: false
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-4">
          <div>
            <label htmlFor="fullName" className="form-label">
              Full Name
            </label>
            <Field
              type="text"
              name="fullName"
              id="fullName"
              className="form-input"
              placeholder="John Doe"
            />
            <ErrorMessage name="fullName" component="div" className="form-error" />
          </div>
          
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <Field
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                className="form-input"
                placeholder="••••••••"
              />
              <ErrorMessage name="confirmPassword" component="div" className="form-error" />
            </div>
          </div>
          
          <div>
            <label htmlFor="phoneNumber" className="form-label">
              Phone Number
            </label>
            <Field
              type="text"
              name="phoneNumber"
              id="phoneNumber"
              className="form-input"
              placeholder="+251 91 234 5678"
            />
            <ErrorMessage name="phoneNumber" component="div" className="form-error" />
          </div>
          
          <div>
            <label htmlFor="nationalId" className="form-label">
              National ID
            </label>
            <Field
              type="text"
              name="nationalId"
              id="nationalId"
              className="form-input"
              placeholder="ETH123456789"
            />
            <ErrorMessage name="nationalId" component="div" className="form-error" />
            <p className="text-gray-500 text-xs mt-1">
              National ID must be 12 characters starting with ETH (e.g., ETH123456789)
            </p>
          </div>
          
          <div className="flex items-center mt-4">
            <Field
              type="checkbox"
              name="termsAccepted"
              id="termsAccepted"
              className="h-4 w-4 text-ethiopian-green focus:ring-ethiopian-green border-gray-300 rounded"
            />
            <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <a href="/terms-of-service" className="text-ethiopian-green hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy-policy" className="text-ethiopian-green hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>
          <ErrorMessage name="termsAccepted" component="div" className="form-error" />
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-2 px-4 rounded-md mt-6"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default RegisterForm;

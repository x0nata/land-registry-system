import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const PropertyForm = ({ initialValues, onSubmit, isEditing = false }) => {
  // Default initial values
  const defaultValues = {
    location: {
      kebele: '',
      subCity: '',
      coordinates: {
        latitude: '',
        longitude: ''
      }
    },
    plotNumber: '',
    area: '',
    propertyType: 'residential'
  };
  
  // Validation schema
  const validationSchema = Yup.object({
    location: Yup.object({
      kebele: Yup.string().required('Kebele is required'),
      subCity: Yup.string().required('Sub-city is required'),
      coordinates: Yup.object({
        latitude: Yup.number().typeError('Latitude must be a number').nullable(),
        longitude: Yup.number().typeError('Longitude must be a number').nullable()
      })
    }),
    plotNumber: Yup.string().required('Plot number is required'),
    area: Yup.number()
      .typeError('Area must be a number')
      .required('Area is required')
      .positive('Area must be a positive number'),
    propertyType: Yup.string()
      .required('Property type is required')
      .oneOf(
        ['residential', 'commercial', 'industrial', 'agricultural'],
        'Invalid property type'
      )
  });
  
  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await onSubmit(values);
      
      if (!isEditing) {
        resetForm();
      }
      
      toast.success(
        isEditing 
          ? 'Property updated successfully' 
          : 'Property registered successfully'
      );
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Formik
      initialValues={initialValues || defaultValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Location Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location.subCity" className="form-label">
                  Sub-city
                </label>
                <Field
                  as="select"
                  name="location.subCity"
                  id="location.subCity"
                  className="form-input"
                >
                  <option value="">Select Sub-city</option>
                  <option value="Addis Ketema">Addis Ketema</option>
                  <option value="Akaky Kaliti">Akaky Kaliti</option>
                  <option value="Arada">Arada</option>
                  <option value="Bole">Bole</option>
                  <option value="Gullele">Gullele</option>
                  <option value="Kirkos">Kirkos</option>
                  <option value="Kolfe Keranio">Kolfe Keranio</option>
                  <option value="Lideta">Lideta</option>
                  <option value="Nifas Silk-Lafto">Nifas Silk-Lafto</option>
                  <option value="Yeka">Yeka</option>
                </Field>
                <ErrorMessage name="location.subCity" component="div" className="form-error" />
              </div>
              
              <div>
                <label htmlFor="location.kebele" className="form-label">
                  Kebele
                </label>
                <Field
                  type="text"
                  name="location.kebele"
                  id="location.kebele"
                  className="form-input"
                  placeholder="e.g., 01"
                />
                <ErrorMessage name="location.kebele" component="div" className="form-error" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="location.coordinates.latitude" className="form-label">
                  Latitude (optional)
                </label>
                <Field
                  type="text"
                  name="location.coordinates.latitude"
                  id="location.coordinates.latitude"
                  className="form-input"
                  placeholder="e.g., 9.0222"
                />
                <ErrorMessage name="location.coordinates.latitude" component="div" className="form-error" />
              </div>
              
              <div>
                <label htmlFor="location.coordinates.longitude" className="form-label">
                  Longitude (optional)
                </label>
                <Field
                  type="text"
                  name="location.coordinates.longitude"
                  id="location.coordinates.longitude"
                  className="form-input"
                  placeholder="e.g., 38.7468"
                />
                <ErrorMessage name="location.coordinates.longitude" component="div" className="form-error" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Property Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="plotNumber" className="form-label">
                  Plot Number
                </label>
                <Field
                  type="text"
                  name="plotNumber"
                  id="plotNumber"
                  className="form-input"
                  placeholder="e.g., AA-123456"
                  disabled={isEditing} // Can't change plot number when editing
                />
                <ErrorMessage name="plotNumber" component="div" className="form-error" />
              </div>
              
              <div>
                <label htmlFor="area" className="form-label">
                  Area (sqm)
                </label>
                <Field
                  type="number"
                  name="area"
                  id="area"
                  className="form-input"
                  placeholder="e.g., 250"
                  min="0"
                  step="0.01"
                />
                <ErrorMessage name="area" component="div" className="form-error" />
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="propertyType" className="form-label">
                Property Type
              </label>
              <Field
                as="select"
                name="propertyType"
                id="propertyType"
                className="form-input"
              >
                <option value="">Select Property Type</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="agricultural">Agricultural</option>
              </Field>
              <ErrorMessage name="propertyType" component="div" className="form-error" />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-2 px-6 rounded-md"
            >
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Registering...') 
                : (isEditing ? 'Update Property' : 'Register Property')}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default PropertyForm;

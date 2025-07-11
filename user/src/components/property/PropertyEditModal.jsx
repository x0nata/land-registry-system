import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { updateProperty } from '../../services/propertyService';

const PropertyEditModal = ({ property, onSuccess, onClose }) => {
  // Check if property can be edited
  const canEdit = ['pending', 'rejected', 'needs_update'].includes(property.status);

  // If property cannot be edited, show error modal
  if (!canEdit) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-red-600">Cannot Edit Property</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This property cannot be edited because it is currently <strong className="capitalize">{property.status}</strong>.
            </p>
            <p className="text-sm text-gray-600">
              Properties can only be edited when they are in "Pending", "Rejected", or "Needs Update" status.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Validation schema
  const validationSchema = Yup.object({
    plotNumber: Yup.string().required('Plot number is required'),
    area: Yup.number()
      .required('Area is required')
      .positive('Area must be positive')
      .min(1, 'Area must be at least 1 square meter'),
    propertyType: Yup.string()
      .required('Property type is required')
      .oneOf(['residential', 'commercial', 'industrial', 'agricultural'], 'Invalid property type'),
    location: Yup.object({
      subCity: Yup.string().required('Sub-city is required'),
      kebele: Yup.string().required('Kebele is required'),
      houseNumber: Yup.string(),
      streetName: Yup.string()
    })
  });

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Double-check on client side before sending request
      if (!canEdit) {
        toast.error('This property cannot be edited in its current status');
        return;
      }

      await updateProperty(property._id || property.id, values);

      if (onSuccess) {
        onSuccess();
      }

      toast.success('Property updated successfully');
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error(error.message || 'Failed to update property');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Property Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <Formik
          initialValues={{
            plotNumber: property.plotNumber || '',
            area: property.area || '',
            propertyType: property.propertyType || '',
            location: {
              subCity: property.location?.subCity || '',
              kebele: property.location?.kebele || '',
              houseNumber: property.location?.houseNumber || '',
              streetName: property.location?.streetName || ''
            }
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-4">
              {/* Plot Number */}
              <div>
                <label htmlFor="plotNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Plot Number
                </label>
                <Field
                  type="text"
                  id="plotNumber"
                  name="plotNumber"
                  placeholder="Enter plot number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <ErrorMessage name="plotNumber" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Area */}
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                  Area (square meters)
                </label>
                <Field
                  type="number"
                  id="area"
                  name="area"
                  placeholder="Enter area in square meters"
                  min="1"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <ErrorMessage name="area" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Property Type */}
              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <Field
                  as="select"
                  id="propertyType"
                  name="propertyType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select property type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="agricultural">Agricultural</option>
                </Field>
                <ErrorMessage name="propertyType" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Location Section */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Location Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sub-city */}
                  <div>
                    <label htmlFor="location.subCity" className="block text-sm font-medium text-gray-700 mb-1">
                      Sub-city
                    </label>
                    <Field
                      type="text"
                      id="location.subCity"
                      name="location.subCity"
                      placeholder="Enter sub-city"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <ErrorMessage name="location.subCity" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Kebele */}
                  <div>
                    <label htmlFor="location.kebele" className="block text-sm font-medium text-gray-700 mb-1">
                      Kebele
                    </label>
                    <Field
                      type="text"
                      id="location.kebele"
                      name="location.kebele"
                      placeholder="Enter kebele"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <ErrorMessage name="location.kebele" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* House Number */}
                  <div>
                    <label htmlFor="location.houseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      House Number (Optional)
                    </label>
                    <Field
                      type="text"
                      id="location.houseNumber"
                      name="location.houseNumber"
                      placeholder="Enter house number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <ErrorMessage name="location.houseNumber" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Street Name */}
                  <div>
                    <label htmlFor="location.streetName" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Name (Optional)
                    </label>
                    <Field
                      type="text"
                      id="location.streetName"
                      name="location.streetName"
                      placeholder="Enter street name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <ErrorMessage name="location.streetName" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              {/* Status Notice */}
              {!['pending', 'rejected', 'needs_update'].includes(property.status) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This property is currently {property.status}.
                    Editing will change the status back to "pending" for review.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Property'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default PropertyEditModal;

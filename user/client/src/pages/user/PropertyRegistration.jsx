import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { registerProperty } from '../../services/propertyService';
import { uploadDocument } from '../../services/documentService';

const PropertyRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState({
    titleDeed: null,
    idCard: null,
    taxClearance: null,
    surveyPlan: null
  });
  const [fileErrors, setFileErrors] = useState({});

  // Validation schemas for different steps
  const propertyDetailsSchema = Yup.object({
    plotNumber: Yup.string().required('Plot number is required'),
    propertyType: Yup.string().required('Property type is required'),
    area: Yup.number()
      .required('Area is required')
      .positive('Area must be a positive number'),
    subCity: Yup.string().required('Sub-city is required'),
    kebele: Yup.string().required('Kebele is required'),
    streetName: Yup.string(),
    houseNumber: Yup.string()
  });

  const ownerDetailsSchema = Yup.object({
    ownerFullName: Yup.string().required('Full name is required'),
    ownerIdNumber: Yup.string().required('ID number is required'),
    ownerPhone: Yup.string().required('Phone number is required'),
    ownerEmail: Yup.string().email('Invalid email').required('Email is required'),
    ownerAddress: Yup.string().required('Address is required')
  });

  // Handle file change
  const handleFileChange = (event, fieldName) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileErrors({
          ...fileErrors,
          [fieldName]: 'File size should not exceed 5MB'
        });
        return;
      }

      // Check file type (PDF, JPG, PNG)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setFileErrors({
          ...fileErrors,
          [fieldName]: 'Only PDF, JPG, and PNG files are allowed'
        });
        return;
      }

      // Clear any previous errors
      const newErrors = { ...fileErrors };
      delete newErrors[fieldName];
      setFileErrors(newErrors);

      // Set the file
      setFiles({
        ...files,
        [fieldName]: file
      });
    }
  };

  // Validate documents before proceeding
  const validateDocuments = () => {
    const requiredDocs = ['titleDeed', 'idCard', 'taxClearance', 'surveyPlan'];
    const newErrors = {};
    let isValid = true;

    requiredDocs.forEach(doc => {
      if (!files[doc]) {
        newErrors[doc] = 'This document is required';
        isValid = false;
      }
    });

    setFileErrors(newErrors);
    return isValid;
  };

  // Helper function to upload documents
  const uploadDocuments = async (propertyId) => {
    const documentMappings = {
      titleDeed: { type: 'title_deed', name: 'Title Deed' },
      idCard: { type: 'id_copy', name: 'ID Copy' },
      taxClearance: { type: 'tax_clearance', name: 'Tax Clearance' },
      surveyPlan: { type: 'application_form', name: 'Application Form' }
    };

    const uploadPromises = [];
    const uploadedDocuments = [];

    for (const [fileKey, file] of Object.entries(files)) {
      if (file && documentMappings[fileKey]) {
        const documentData = {
          documentType: documentMappings[fileKey].type,
          documentName: documentMappings[fileKey].name
        };

        uploadPromises.push(
          uploadDocument(propertyId, documentData, file)
            .then(result => {
              uploadedDocuments.push(result);
              return result;
            })
            .catch(error => {
              console.error(`Failed to upload ${documentMappings[fileKey].name}:`, error);
              throw new Error(`Failed to upload ${documentMappings[fileKey].name}: ${error.message}`);
            })
        );
      }
    }

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }

    return uploadedDocuments;
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Map form values to API expected format
      const propertyData = {
        location: {
          kebele: values.kebele,
          subCity: values.subCity,
          coordinates: {
            latitude: values.latitude || null,
            longitude: values.longitude || null
          }
        },
        plotNumber: values.plotNumber,
        area: parseFloat(values.area),
        propertyType: values.propertyType
      };

      console.log('Submitting property data:', propertyData);

      // Step 1: Register the property
      const propertyResponse = await registerProperty(propertyData);
      console.log('Property registered successfully:', propertyResponse);

      // Step 2: Upload documents if property was created successfully
      if (propertyResponse && propertyResponse._id) {
        console.log('Uploading documents for property:', propertyResponse._id);

        try {
          const uploadedDocuments = await uploadDocuments(propertyResponse._id);
          console.log('Documents uploaded successfully:', uploadedDocuments);

          toast.success(`Property registration submitted successfully! ${uploadedDocuments.length} documents uploaded. Your application is now pending review.`);
        } catch (documentError) {
          console.error('Document upload error:', documentError);
          // Property was created but documents failed to upload
          toast.warning(`Property registered successfully, but some documents failed to upload: ${documentError.message}. You can upload them later from your dashboard.`);
        }
      } else {
        toast.success('Property registration submitted successfully! Your application is now pending review.');
      }

      // Redirect to dashboard
      navigate('/dashboard/user');
    } catch (error) {
      console.error('Property registration error:', error);

      // Handle specific error messages
      if (error.message) {
        toast.error(error.message);
      } else if (error.errors && error.errors.length > 0) {
        // Handle validation errors
        const errorMessages = error.errors.map(err => err.msg).join(', ');
        toast.error(`Validation errors: ${errorMessages}`);
      } else {
        toast.error('Failed to submit property registration. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Next step handler
  const handleNextStep = (values) => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3 && validateDocuments()) {
      setStep(4);
    }
  };

  // Previous step handler
  const handlePrevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Property Registration</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <span className="text-sm mt-1">Property Details</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <span className="text-sm mt-1">Owner Details</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                3
              </div>
              <span className="text-sm mt-1">Documents</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 4 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${step >= 4 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                4
              </div>
              <span className="text-sm mt-1">Review & Submit</span>
            </div>
          </div>
        </div>

        <Formik
          initialValues={{
            // Property details
            plotNumber: '',
            propertyType: '',
            area: '',
            subCity: '',
            kebele: '',
            streetName: '',
            houseNumber: '',
            // Owner details
            ownerFullName: '',
            ownerIdNumber: '',
            ownerPhone: '',
            ownerEmail: '',
            ownerAddress: '',
            // Additional info
            additionalInfo: ''
          }}
          validationSchema={step === 1 ? propertyDetailsSchema : step === 2 ? ownerDetailsSchema : null}
          onSubmit={handleSubmit}
        >
          {({ values, isSubmitting, isValid, setFieldValue }) => (
            <Form className="space-y-6">
              {/* Step 1: Property Details */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Property Details</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="plotNumber" className="form-label">
                        Plot Number <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        id="plotNumber"
                        name="plotNumber"
                        className="form-input"
                      />
                      <ErrorMessage name="plotNumber" component="div" className="form-error" />
                    </div>

                    <div>
                      <label htmlFor="propertyType" className="form-label">
                        Property Type <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        id="propertyType"
                        name="propertyType"
                        className="form-input"
                      >
                        <option value="">Select property type</option>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                        <option value="agricultural">Agricultural</option>
                      </Field>
                      <ErrorMessage name="propertyType" component="div" className="form-error" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="area" className="form-label">
                      Area (sq. meters) <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="number"
                      id="area"
                      name="area"
                      className="form-input"
                    />
                    <ErrorMessage name="area" component="div" className="form-error" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="subCity" className="form-label">
                        Sub-City <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        id="subCity"
                        name="subCity"
                        className="form-input"
                      />
                      <ErrorMessage name="subCity" component="div" className="form-error" />
                    </div>

                    <div>
                      <label htmlFor="kebele" className="form-label">
                        Kebele <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        id="kebele"
                        name="kebele"
                        className="form-input"
                      />
                      <ErrorMessage name="kebele" component="div" className="form-error" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="streetName" className="form-label">
                        Street Name
                      </label>
                      <Field
                        type="text"
                        id="streetName"
                        name="streetName"
                        className="form-input"
                      />
                      <ErrorMessage name="streetName" component="div" className="form-error" />
                    </div>

                    <div>
                      <label htmlFor="houseNumber" className="form-label">
                        House Number
                      </label>
                      <Field
                        type="text"
                        id="houseNumber"
                        name="houseNumber"
                        className="form-input"
                      />
                      <ErrorMessage name="houseNumber" component="div" className="form-error" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Owner Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Owner Details</h2>

                  <div>
                    <label htmlFor="ownerFullName" className="form-label">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="text"
                      id="ownerFullName"
                      name="ownerFullName"
                      className="form-input"
                    />
                    <ErrorMessage name="ownerFullName" component="div" className="form-error" />
                  </div>

                  <div>
                    <label htmlFor="ownerIdNumber" className="form-label">
                      ID Number <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="text"
                      id="ownerIdNumber"
                      name="ownerIdNumber"
                      className="form-input"
                    />
                    <ErrorMessage name="ownerIdNumber" component="div" className="form-error" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ownerPhone" className="form-label">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        id="ownerPhone"
                        name="ownerPhone"
                        className="form-input"
                      />
                      <ErrorMessage name="ownerPhone" component="div" className="form-error" />
                    </div>

                    <div>
                      <label htmlFor="ownerEmail" className="form-label">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="email"
                        id="ownerEmail"
                        name="ownerEmail"
                        className="form-input"
                      />
                      <ErrorMessage name="ownerEmail" component="div" className="form-error" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ownerAddress" className="form-label">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="text"
                      id="ownerAddress"
                      name="ownerAddress"
                      className="form-input"
                    />
                    <ErrorMessage name="ownerAddress" component="div" className="form-error" />
                  </div>
                </div>
              )}

              {/* Step 3: Documents */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Required Documents</h2>
                  <p className="text-gray-600 mb-4">
                    Please upload the following documents in PDF, JPG, or PNG format. Maximum file size: 5MB.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="titleDeed" className="form-label">
                        Title Deed <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        id="titleDeed"
                        onChange={(e) => handleFileChange(e, 'titleDeed')}
                        className="form-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {fileErrors.titleDeed && (
                        <div className="form-error">{fileErrors.titleDeed}</div>
                      )}
                      {files.titleDeed && (
                        <div className="text-sm text-green-600 mt-1">
                          File selected: {files.titleDeed.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="idCard" className="form-label">
                        ID Card <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        id="idCard"
                        onChange={(e) => handleFileChange(e, 'idCard')}
                        className="form-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {fileErrors.idCard && (
                        <div className="form-error">{fileErrors.idCard}</div>
                      )}
                      {files.idCard && (
                        <div className="text-sm text-green-600 mt-1">
                          File selected: {files.idCard.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="taxClearance" className="form-label">
                        Tax Clearance Certificate <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        id="taxClearance"
                        onChange={(e) => handleFileChange(e, 'taxClearance')}
                        className="form-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {fileErrors.taxClearance && (
                        <div className="form-error">{fileErrors.taxClearance}</div>
                      )}
                      {files.taxClearance && (
                        <div className="text-sm text-green-600 mt-1">
                          File selected: {files.taxClearance.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="surveyPlan" className="form-label">
                        Application Form <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        id="surveyPlan"
                        onChange={(e) => handleFileChange(e, 'surveyPlan')}
                        className="form-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {fileErrors.surveyPlan && (
                        <div className="form-error">{fileErrors.surveyPlan}</div>
                      )}
                      {files.surveyPlan && (
                        <div className="text-sm text-green-600 mt-1">
                          File selected: {files.surveyPlan.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Review & Submit</h2>
                  <p className="text-gray-600 mb-4">
                    Please review your information before submitting.
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Property Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">Plot Number:</div>
                      <div>{values.plotNumber}</div>

                      <div className="text-gray-600">Property Type:</div>
                      <div className="capitalize">{values.propertyType}</div>

                      <div className="text-gray-600">Area:</div>
                      <div>{values.area} sq. meters</div>

                      <div className="text-gray-600">Location:</div>
                      <div>{values.subCity} Sub-city, Kebele {values.kebele}</div>

                      {values.streetName && (
                        <>
                          <div className="text-gray-600">Street Name:</div>
                          <div>{values.streetName}</div>
                        </>
                      )}

                      {values.houseNumber && (
                        <>
                          <div className="text-gray-600">House Number:</div>
                          <div>{values.houseNumber}</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Owner Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">Full Name:</div>
                      <div>{values.ownerFullName}</div>

                      <div className="text-gray-600">ID Number:</div>
                      <div>{values.ownerIdNumber}</div>

                      <div className="text-gray-600">Phone Number:</div>
                      <div>{values.ownerPhone}</div>

                      <div className="text-gray-600">Email Address:</div>
                      <div>{values.ownerEmail}</div>

                      <div className="text-gray-600">Address:</div>
                      <div>{values.ownerAddress}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Documents</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">Title Deed:</div>
                      <div>{files.titleDeed?.name}</div>

                      <div className="text-gray-600">ID Card:</div>
                      <div>{files.idCard?.name}</div>

                      <div className="text-gray-600">Tax Clearance Certificate:</div>
                      <div>{files.taxClearance?.name}</div>

                      <div className="text-gray-600">Application Form:</div>
                      <div>{files.surveyPlan?.name}</div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="additionalInfo" className="form-label">
                      Additional Information (Optional)
                    </label>
                    <Field
                      as="textarea"
                      id="additionalInfo"
                      name="additionalInfo"
                      rows="3"
                      className="form-input"
                      placeholder="Any additional information you want to provide"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="termsAgreement"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        onChange={(e) => setFieldValue('termsAgreement', e.target.checked)}
                      />
                      <label htmlFor="termsAgreement" className="ml-2 block text-sm text-gray-900">
                        I confirm that all the information provided is accurate and complete. I understand that providing false information may result in legal consequences.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => handleNextStep(values)}
                    className="ml-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                    disabled={step === 1 && !propertyDetailsSchema.isValidSync(values) ||
                             step === 2 && !ownerDetailsSchema.isValidSync(values)}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !values.termsAgreement}
                    className={`ml-auto px-4 py-2 rounded-md ${
                      values.termsAgreement
                        ? 'bg-primary text-white hover:bg-primary-dark'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                  </button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default PropertyRegistration;

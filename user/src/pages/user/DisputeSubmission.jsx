import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { submitDispute } from '../../services/disputeService';
import { getUserProperties } from '../../services/propertyService';
import { uploadDocument } from '../../services/documentService';

const DisputeSubmission = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  // Validation schema
  const validationSchema = Yup.object({
    property: Yup.string().required('Property selection is required'),
    disputeType: Yup.string().required('Dispute type is required'),
    title: Yup.string()
      .required('Title is required')
      .max(200, 'Title cannot exceed 200 characters'),
    description: Yup.string()
      .required('Description is required')
      .max(2000, 'Description cannot exceed 2000 characters'),
  });

  // Fetch user properties on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await getUserProperties();
        setProperties(response.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('Failed to load properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Handle file selection for evidence
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const isValidType = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid file type. Please upload PDF, JPG, or PNG files.`);
        return false;
      }
      
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }
      
      return true;
    });

    setEvidenceFiles(prev => [...prev, ...validFiles]);
  };

  // Remove evidence file
  const removeFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload evidence files
  const uploadEvidence = async (disputeId) => {
    const uploadedEvidence = [];
    
    for (const file of evidenceFiles) {
      try {
        const documentData = {
          documentType: 'other',
          documentName: `Evidence - ${file.name}`
        };
        
        const uploadResponse = await uploadDocument(disputeId, documentData, file);
        uploadedEvidence.push({
          documentType: 'other',
          documentName: documentData.documentName,
          fileId: uploadResponse.fileId,
          filename: file.name,
          fileType: file.type
        });
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        toast.warning(`Failed to upload ${file.name}`);
      }
    }
    
    return uploadedEvidence;
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Upload evidence files first if any
      let evidence = [];
      if (evidenceFiles.length > 0) {
        // For now, we'll create mock evidence data
        // In a real implementation, you'd upload files first
        evidence = evidenceFiles.map(file => ({
          documentType: 'other',
          documentName: `Evidence - ${file.name}`,
          fileId: 'mock-file-id', // This would be the actual file ID from upload
          filename: file.name,
          fileType: file.type
        }));
      }

      const disputeData = {
        property: values.property,
        disputeType: values.disputeType,
        title: values.title,
        description: values.description,
        evidence
      };

      const response = await submitDispute(disputeData);
      
      toast.success('Dispute submitted successfully! You will be notified of any updates.');
      navigate('/disputes');
    } catch (error) {
      console.error('Error submitting dispute:', error);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to submit dispute. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Submit Land Dispute</h1>
        
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Please ensure all information is accurate and complete. 
            False or misleading information may result in dismissal of your dispute and potential legal consequences.
          </p>
        </div>

        <Formik
          initialValues={{
            property: '',
            disputeType: '',
            title: '',
            description: ''
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div>
                <label htmlFor="property" className="form-label">
                  Select Property <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  id="property"
                  name="property"
                  className="form-input"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property._id} value={property._id}>
                      Plot {property.plotNumber} - {property.location.subCity}, {property.location.kebele}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="property" component="div" className="form-error" />
                {properties.length === 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    No properties found. You must have registered properties to submit a dispute.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="disputeType" className="form-label">
                  Dispute Type <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  id="disputeType"
                  name="disputeType"
                  className="form-input"
                >
                  <option value="">Select dispute type</option>
                  <option value="ownership_dispute">Ownership Dispute</option>
                  <option value="boundary_dispute">Boundary Dispute</option>
                  <option value="documentation_error">Documentation Error</option>
                  <option value="fraudulent_registration">Fraudulent Registration</option>
                  <option value="inheritance_dispute">Inheritance Dispute</option>
                  <option value="other">Other</option>
                </Field>
                <ErrorMessage name="disputeType" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="title" className="form-label">
                  Dispute Title <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  placeholder="Brief title describing your dispute"
                />
                <ErrorMessage name="title" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="description" className="form-label">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  rows="6"
                  className="form-input"
                  placeholder="Provide a detailed description of your dispute, including relevant dates, parties involved, and specific issues..."
                />
                <ErrorMessage name="description" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="evidence" className="form-label">
                  Supporting Evidence (Optional)
                </label>
                <input
                  type="file"
                  id="evidence"
                  multiple
                  onChange={handleFileChange}
                  className="form-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Upload supporting documents, photos, or other evidence. Accepted formats: PDF, JPG, PNG. Max 5MB per file.
                </p>
                
                {evidenceFiles.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                    <div className="space-y-2">
                      {evidenceFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/user')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || properties.length === 0}
                  className={`px-6 py-2 rounded-md ${
                    isSubmitting || properties.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default DisputeSubmission;

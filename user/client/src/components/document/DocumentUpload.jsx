import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { uploadDocument } from '../../services/documentService';

const DocumentUpload = ({ propertyId, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Validation schema
  const validationSchema = Yup.object({
    documentType: Yup.string()
      .required('Document type is required')
      .oneOf(
        ['title_deed', 'id_copy', 'application_form', 'tax_clearance', 'other'],
        'Invalid document type'
      ),
    documentName: Yup.string().required('Document name is required')
  });

  // Validate and process file
  const validateAndSetFile = (selectedFile, setFieldValue) => {
    if (!selectedFile) {
      setFile(null);
      setFilePreview(null);
      return false;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return false;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Only images, PDFs, and common document formats are allowed.');
      return false;
    }

    setFile(selectedFile);
    setFieldValue('file', selectedFile);

    // Create file preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // For non-image files, just show the file name
      setFilePreview(null);
    }

    return true;
  };

  // Handle file change from input
  const handleFileChange = (event, setFieldValue) => {
    const selectedFile = event.currentTarget.files[0];
    validateAndSetFile(selectedFile, setFieldValue);
  };

  // Handle drag and drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e, setFieldValue) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const selectedFile = droppedFiles[0];
      validateAndSetFile(selectedFile, setFieldValue);
    }
  };

  // Handle click to open file dialog
  const handleFileAreaClick = (fileInputRef) => {
    if (fileInputRef && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!file) {
        toast.error('Please select a file to upload');
        return;
      }

      console.log('Uploading document:', {
        propertyId,
        documentType: values.documentType,
        documentName: values.documentName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const documentData = {
        documentType: values.documentType,
        documentName: values.documentName
      };

      await uploadDocument(propertyId, documentData, file);

      // Reset form
      resetForm();
      setFile(null);
      setFilePreview(null);

      // Show success message
      toast.success('Document uploaded successfully');

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Show more specific error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload document';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Get document type display name
  const getDocumentTypeDisplay = (type) => {
    switch (type) {
      case 'title_deed':
        return 'Title Deed';
      case 'id_copy':
        return 'National ID';
      case 'application_form':
        return 'Application Form';
      case 'tax_clearance':
        return 'Tax Clearance';
      case 'other':
        return 'Other Document';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Upload Document</h3>

      <Formik
        initialValues={{
          documentType: '',
          documentName: '',
          file: null
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, setFieldValue }) => {
          const fileInputRef = React.useRef(null);

          return (
            <Form className="space-y-4">
              <div>
                <label htmlFor="documentType" className="form-label">
                  Document Type
                </label>
                <Field
                  as="select"
                  name="documentType"
                  id="documentType"
                  className="form-input"
                  onChange={(e) => {
                    const value = e.target.value;
                    setFieldValue('documentType', value);

                    // Auto-fill document name based on type
                    if (value) {
                      setFieldValue('documentName', getDocumentTypeDisplay(value));
                    }
                  }}
                >
                  <option value="">Select Document Type</option>
                  <option value="title_deed">Title Deed</option>
                  <option value="id_copy">National ID</option>
                  <option value="application_form">Application Form</option>
                  <option value="tax_clearance">Tax Clearance</option>
                  <option value="other">Other Document</option>
                </Field>
                <ErrorMessage name="documentType" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="documentName" className="form-label">
                  Document Name
                </label>
                <Field
                  type="text"
                  name="documentName"
                  id="documentName"
                  className="form-input"
                  placeholder="e.g., Title Deed"
                />
                <ErrorMessage name="documentName" component="div" className="form-error" />
              </div>

              <div>
                <label htmlFor="file" className="form-label">
                  File
                </label>
                <div
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, setFieldValue)}
                  onClick={() => handleFileAreaClick(fileInputRef)}
                >
                  <div className="space-y-1 text-center">
                    <svg
                      className={`mx-auto h-12 w-12 ${isDragOver ? 'text-primary' : 'text-gray-400'}`}
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <span className={`font-medium ${isDragOver ? 'text-primary' : 'text-primary hover:text-primary-dark'}`}>
                        {isDragOver ? 'Drop file here' : 'Click to upload or drag and drop'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF, DOC up to 5MB
                    </p>
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, setFieldValue)}
                    />
                  </div>
                </div>
                {filePreview && (
                  <div className="mt-2">
                    <img
                      src={filePreview}
                      alt="File preview"
                      className="h-32 object-contain"
                    />
                  </div>
                )}
                {file && !filePreview && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected file: {file.name}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="btn-primary py-2 px-6 rounded-md"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default DocumentUpload;

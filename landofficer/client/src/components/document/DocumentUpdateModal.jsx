import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { updateDocument } from '../../services/documentService';

const DocumentUpdateModal = ({ document, onSuccess, onClose }) => {
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

    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return false;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Only JPG, PNG, PDF, and DOC files are allowed');
      return false;
    }

    setFile(selectedFile);
    setFieldValue('file', selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }

    return true;
  };

  // Handle file selection from input
  const handleFileChange = (event, setFieldValue) => {
    const selectedFile = event.target.files[0];
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
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (!file) {
        toast.error('Please select a file to upload');
        return;
      }

      const documentData = {
        documentType: values.documentType,
        documentName: values.documentName
      };

      await updateDocument(document._id, documentData, file);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error(error.message || 'Failed to update document');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Update Document</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Current Document:</p>
          <p className="font-medium">{getDocumentTypeDisplay(document.documentType)}</p>
          <p className="text-sm text-gray-500">{document.documentName}</p>
        </div>

        <Formik
          initialValues={{
            documentType: document.documentType,
            documentName: document.documentName,
            file: null
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, setFieldValue, values }) => {
            const fileInputRef = React.useRef(null);

            return (
              <Form className="space-y-4">
                {/* Document Type */}
                <div>
                  <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <Field
                    as="select"
                    id="documentType"
                    name="documentType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select document type</option>
                    <option value="title_deed">Title Deed</option>
                    <option value="id_copy">National ID</option>
                    <option value="application_form">Application Form</option>
                    <option value="tax_clearance">Tax Clearance</option>
                    <option value="other">Other Document</option>
                  </Field>
                  <ErrorMessage name="documentType" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Document Name */}
                <div>
                  <label htmlFor="documentName" className="block text-sm font-medium text-gray-700 mb-1">
                    Document Name
                  </label>
                  <Field
                    type="text"
                    id="documentName"
                    name="documentName"
                    placeholder="Enter document name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <ErrorMessage name="documentName" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New File
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
                        className="h-32 object-contain mx-auto"
                      />
                    </div>
                  )}
                  {file && !filePreview && (
                    <div className="mt-2 text-sm text-gray-600 text-center">
                      Selected file: {file.name}
                    </div>
                  )}
                </div>

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
                    disabled={isSubmitting || !file}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Document'}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default DocumentUpdateModal;

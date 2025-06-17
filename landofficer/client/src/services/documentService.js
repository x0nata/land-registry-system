import api from './api';

// Get all documents (admin/land officer only)
export const getAllDocuments = async (filters = {}) => {
  try {
    const response = await api.get('/documents', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch documents' };
  }
};

// Upload a document for a property
export const uploadDocument = async (propertyId, documentData, file) => {
  try {
    // Validate inputs
    if (!propertyId) {
      throw new Error('Property ID is required');
    }
    if (!file) {
      throw new Error('File is required');
    }
    if (!documentData.documentType) {
      throw new Error('Document type is required');
    }
    if (!documentData.documentName) {
      throw new Error('Document name is required');
    }

    console.log('Creating FormData for upload:', {
      propertyId,
      documentType: documentData.documentType,
      documentName: documentData.documentName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentData.documentType);
    formData.append('documentName', documentData.documentName);

    console.log('Sending upload request to:', `/documents/property/${propertyId}`);

    const response = await api.post(`/documents/property/${propertyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);

    if (error.response) {
      // Server responded with error status
      console.error('Server error response:', error.response.data);
      throw error.response.data || { message: 'Server error during upload' };
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error:', error.request);
      throw { message: 'Network error - please check your connection' };
    } else {
      // Something else happened
      console.error('Upload error:', error.message);
      throw { message: error.message || 'Failed to upload document' };
    }
  }
};

// Get all documents for a property
export const getPropertyDocuments = async (propertyId) => {
  try {
    const response = await api.get(`/documents/property/${propertyId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch documents' };
  }
};

// Get a single document by ID
export const getDocumentById = async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch document' };
  }
};

// Delete a document
export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete document' };
  }
};

// Update a document (replace with new file)
export const updateDocument = async (documentId, documentData, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (documentData.documentType) {
      formData.append('documentType', documentData.documentType);
    }
    if (documentData.documentName) {
      formData.append('documentName', documentData.documentName);
    }

    const response = await api.put(`/documents/${documentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update document' };
  }
};

// Get all pending documents for verification (land officer only)
export const getPendingDocuments = async () => {
  try {
    const response = await api.get('/documents/pending');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch pending documents' };
  }
};

// Verify a document (land officer/admin only)
export const verifyDocument = async (documentId, notes) => {
  try {
    const response = await api.put(`/documents/${documentId}/verify`, { notes });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to verify document' };
  }
};

// Reject a document (land officer/admin only)
export const rejectDocument = async (documentId, reason) => {
  try {
    const response = await api.put(`/documents/${documentId}/reject`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to reject document' };
  }
};

// Request document update (land officer/admin only)
export const requestDocumentUpdate = async (documentId, reason) => {
  try {
    const response = await api.put(`/documents/${documentId}/request-update`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to request document update' };
  }
};

// Download a document
export const downloadDocument = async (documentId) => {
  console.log('=== DOWNLOAD FUNCTION CALLED ===');
  console.log('Document ID:', documentId);

  try {
    // Validate document ID
    if (!documentId) {
      console.error('No document ID provided');
      throw new Error('Document ID is required');
    }

    console.log('Making API request to:', `/documents/${documentId}/download`);

    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });

    console.log('=== API RESPONSE RECEIVED ===');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data type:', typeof response.data);
    console.log('Data size:', response.data?.size);
    console.log('Data constructor:', response.data?.constructor?.name);
    console.log('Content-Type:', response.headers['content-type']);

    // Check if response is actually a blob with content
    if (!response.data) {
      console.error('No response data received');
      throw new Error('No file data received');
    }

    if (response.data.size === 0) {
      console.error('Empty file received');
      throw new Error('Empty file received');
    }

    // Check if the response is actually a JSON error (common issue)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      console.error('Received JSON response instead of file blob');
      // Try to read the JSON error message
      try {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Server returned an error instead of the file');
      } catch (parseError) {
        throw new Error('Server returned an error response instead of the file');
      }
    }

    // Additional check: if the blob is very small, it might be an error message
    if (response.data.size < 100) {
      try {
        const text = await response.data.text();
        if (text.includes('message') || text.includes('error')) {
          throw new Error('Server error: ' + text);
        }
      } catch (readError) {
        // If we can't read it, assume it's a valid small file
      }
    }

    console.log('=== CREATING DOWNLOAD LINK ===');

    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    console.log('Blob URL created:', url);

    const link = document.createElement('a');
    link.href = url;

    // Get the filename from the Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = `document-${documentId}`;

    if (contentDisposition) {
      console.log('Content-Disposition header:', contentDisposition);
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }

    console.log('Final filename:', filename);

    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);

    console.log('Triggering download click...');
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('=== DOWNLOAD COMPLETED SUCCESSFULLY ===');
    return true;

  } catch (error) {
    console.error('=== DOWNLOAD ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    // Handle different types of errors
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Document not found');
      } else if (error.response.status === 403) {
        throw new Error('Not authorized to download this document');
      } else if (error.response.status === 500) {
        throw new Error('Server error while downloading document');
      }
    }

    throw new Error(error.message || 'Failed to download document');
  }
};

// Preview a document
export const previewDocument = async (documentId) => {
  console.log('=== PREVIEW FUNCTION CALLED ===');
  console.log('Document ID:', documentId);

  try {
    // Validate document ID
    if (!documentId) {
      console.error('No document ID provided');
      throw new Error('Document ID is required');
    }

    console.log('Making API request to:', `/documents/${documentId}/preview`);

    const response = await api.get(`/documents/${documentId}/preview`, {
      responseType: 'blob'
    });

    console.log('=== PREVIEW API RESPONSE RECEIVED ===');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data type:', typeof response.data);
    console.log('Data size:', response.data?.size);
    console.log('Content-Type:', response.headers['content-type']);

    // Check if response is actually a blob with content
    if (!response.data) {
      console.error('No response data received');
      throw new Error('No file data received');
    }

    if (response.data.size === 0) {
      console.error('Empty file received');
      throw new Error('Empty file received');
    }

    // Check if the response is actually a JSON error (common issue)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      console.error('Received JSON response instead of file blob');
      // Try to read the JSON error message
      try {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Server returned an error instead of the file');
      } catch (parseError) {
        throw new Error('Server returned an error response instead of the file');
      }
    }

    // Additional check: if the blob is very small, it might be an error message
    if (response.data.size < 100) {
      console.warn('Received very small file, checking if it\'s an error message');
      try {
        const text = await response.data.text();
        if (text.includes('message') || text.includes('error')) {
          console.error('Small blob contains error message:', text);
          throw new Error('Server error: ' + text);
        }
      } catch (readError) {
        // If we can't read it, assume it's a valid small file
        console.log('Could not read small blob as text, assuming it\'s a valid file');
      }
    }

    console.log('=== CREATING PREVIEW WINDOW ===');

    // Create a blob URL for the document
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream'
    });
    const url = window.URL.createObjectURL(blob);
    console.log('Blob URL created for preview:', url);

    // Open in new window
    const newWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

    if (!newWindow) {
      // If popup was blocked, provide fallback
      console.warn('Popup blocked, providing download fallback');
      const link = document.createElement('a');
      link.href = url;
      link.download = `preview-document-${documentId}`;
      link.click();
      window.URL.revokeObjectURL(url);
      throw new Error('Popup blocked. Document downloaded instead.');
    }

    // Clean up the URL after a delay to allow the window to load
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 5000);

    console.log('=== PREVIEW OPENED SUCCESSFULLY ===');
    return true;

  } catch (error) {
    console.error('=== PREVIEW ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    // Handle different types of errors
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Document not found');
      } else if (error.response.status === 403) {
        throw new Error('Not authorized to preview this document');
      } else if (error.response.status === 500) {
        throw new Error('Server error while previewing document');
      }
    }

    throw new Error(error.message || 'Failed to preview document');
  }
};

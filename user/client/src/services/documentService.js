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



// Download a document with retry logic
export const downloadDocument = async (documentId, retryCount = 0) => {
  console.log('=== DOWNLOAD FUNCTION CALLED ===');
  console.log('Document ID:', documentId);
  console.log('Retry count:', retryCount);

  try {
    // Validate document ID
    if (!documentId) {
      console.error('No document ID provided');
      throw new Error('Document ID is required');
    }

    // Validate document ID format (MongoDB ObjectId is 24 characters)
    if (typeof documentId !== 'string' || documentId.length !== 24) {
      console.error('Invalid document ID format:', documentId);
      throw new Error('Invalid document ID format');
    }

    console.log('Making API request to:', `/documents/${documentId}/download`);

    // Make the API request - authentication is handled by the API interceptor
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
      timeout: 60000 // 60 second timeout for large files
    });

    console.log('=== API RESPONSE RECEIVED ===');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data type:', typeof response.data);
    console.log('Data size:', response.data?.size);
    console.log('Data constructor:', response.data?.constructor?.name);

    // Check if response is actually a blob with content
    if (!response.data) {
      console.error('No response data received');
      throw new Error('No file data received');
    }

    if (response.data.size === 0) {
      console.error('Empty file received');
      throw new Error('Empty file received');
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
      const status = error.response.status;
      const data = error.response.data;

      if (status === 400) {
        throw new Error(data?.message || 'Invalid request - check document ID format');
      } else if (status === 401) {
        // Clear any invalid tokens and redirect to login
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        throw new Error('Authentication required - please log in again');
      } else if (status === 403) {
        throw new Error('Not authorized to download this document');
      } else if (status === 404) {
        throw new Error('Document not found or file missing from storage');
      } else if (status === 500) {
        throw new Error(data?.message || 'Server error while downloading document');
      } else {
        throw new Error(`HTTP ${status}: ${data?.message || 'Unknown server error'}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      // Retry on timeout if we haven't exceeded max retries
      if (retryCount < 2) {
        console.log(`Download timeout, retrying... (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return downloadDocument(documentId, retryCount + 1);
      }
      throw new Error('Download timeout - please try again later');
    } else if (error.request) {
      throw new Error('Network error - please check your connection');
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

    // Validate document ID format (MongoDB ObjectId is 24 characters)
    if (typeof documentId !== 'string' || documentId.length !== 24) {
      console.error('Invalid document ID format:', documentId);
      throw new Error('Invalid document ID format');
    }

    console.log('Making API request to:', `/documents/${documentId}/preview`);

    // Make the API request - authentication is handled by the API interceptor

    const response = await api.get(`/documents/${documentId}/preview`, {
      responseType: 'blob',
      timeout: 60000 // 60 second timeout for large files
    });

    console.log('=== PREVIEW API RESPONSE RECEIVED ===');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data type:', typeof response.data);
    console.log('Data size:', response.data?.size);

    // Check if response is actually a blob with content
    if (!response.data) {
      console.error('No response data received');
      throw new Error('No file data received');
    }

    if (response.data.size === 0) {
      console.error('Empty file received');
      throw new Error('Empty file received');
    }

    console.log('=== CREATING PREVIEW BLOB URL ===');

    // Create a blob URL for preview
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    console.log('Preview blob URL created:', url);

    // Get content type from response headers
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    console.log('Content type:', contentType);

    return {
      url,
      contentType,
      size: response.data.size,
      cleanup: () => window.URL.revokeObjectURL(url)
    };

  } catch (error) {
    console.error('=== PREVIEW ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 400) {
        throw new Error(data?.message || 'Invalid request - check document ID format');
      } else if (status === 401) {
        // Clear any invalid tokens and redirect to login
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        throw new Error('Authentication required - please log in again');
      } else if (status === 403) {
        throw new Error('Not authorized to preview this document');
      } else if (status === 404) {
        throw new Error('Document not found or file missing from storage');
      } else if (status === 500) {
        throw new Error(data?.message || 'Server error while previewing document');
      } else {
        throw new Error(`HTTP ${status}: ${data?.message || 'Unknown server error'}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Preview timeout - please try again');
    } else if (error.request) {
      throw new Error('Network error - please check your connection');
    }

    throw new Error(error.message || 'Failed to preview document');
  }
};

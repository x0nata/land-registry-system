import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState('');

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch application data
  useEffect(() => {
    // In a real app, this would make an API call to fetch application details
    // For now, we'll simulate fetching data
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Mock application data
      const mockApplication = {
        id: id,
        type: 'registration',
        status: 'under_review',
        submittedDate: '2023-05-10T10:30:00Z',
        lastUpdated: '2023-05-15T14:20:00Z',
        propertyId: 'prop123',
        requiredDocuments: [
          {
            type: 'titleDeed',
            status: 'verified',
            uploadDate: '2023-05-10T10:30:00Z',
            verificationDate: '2023-05-12T09:15:00Z',
            notes: 'Document verified successfully'
          },
          {
            type: 'idCard',
            status: 'verified',
            uploadDate: '2023-05-10T10:30:00Z',
            verificationDate: '2023-05-12T09:20:00Z',
            notes: 'Document verified successfully'
          },
          {
            type: 'taxClearance',
            status: 'rejected',
            uploadDate: '2023-05-10T10:30:00Z',
            verificationDate: '2023-05-12T09:25:00Z',
            notes: 'Document is expired. Please upload a valid tax clearance certificate.'
          },
          {
            type: 'surveyPlan',
            status: 'pending',
            uploadDate: '2023-05-10T10:30:00Z',
            verificationDate: null,
            notes: null
          }
        ],
        payments: [
          {
            type: 'registrationFee',
            amount: 5000,
            currency: 'ETB',
            status: 'completed',
            paymentDate: '2023-05-11T11:20:00Z',
            paymentMethod: 'cbe_birr',
            reference: 'CBE123456789'
          }
        ],
        timeline: [
          {
            date: '2023-05-10T10:30:00Z',
            action: 'Application Submitted',
            description: 'Property registration application submitted'
          },
          {
            date: '2023-05-11T11:20:00Z',
            action: 'Payment Completed',
            description: 'Registration fee payment completed'
          },
          {
            date: '2023-05-12T09:15:00Z',
            action: 'Document Verified',
            description: 'Title Deed document verified'
          },
          {
            date: '2023-05-12T09:20:00Z',
            action: 'Document Verified',
            description: 'ID Card document verified'
          },
          {
            date: '2023-05-12T09:25:00Z',
            action: 'Document Rejected',
            description: 'Tax Clearance document rejected: Document is expired'
          },
          {
            date: '2023-05-15T14:20:00Z',
            action: 'Under Review',
            description: 'Application is under review by land officer'
          }
        ],
        notes: [
          {
            date: '2023-05-15T14:20:00Z',
            from: 'Land Officer',
            message: 'Your application is under review. Please upload a valid tax clearance certificate.'
          }
        ]
      };
      
      // Mock property data
      const mockProperty = {
        id: 'prop123',
        plotNumber: 'AA-123456',
        propertyType: 'residential',
        area: 250,
        location: {
          subCity: 'Kirkos',
          kebele: '02',
          streetName: 'Bole Road',
          houseNumber: '123'
        },
        status: 'under_review'
      };
      
      setApplication(mockApplication);
      setProperty(mockProperty);
      setLoading(false);
    }, 1000);
  }, [id]);

  // Handle file change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setDocumentError('File size should not exceed 5MB');
        return;
      }

      // Check file type (PDF, JPG, PNG)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setDocumentError('Only PDF, JPG, and PNG files are allowed');
        return;
      }

      // Clear any previous errors
      setDocumentError('');
      setDocumentFile(file);
    }
  };

  // Handle document upload
  const handleDocumentUpload = (e) => {
    e.preventDefault();
    
    if (!documentFile) {
      setDocumentError('Please select a file to upload');
      return;
    }
    
    // In a real app, this would make an API call to upload the document
    // For now, we'll simulate a successful document upload
    
    // Update application data with new document
    const updatedApplication = { ...application };
    const documentIndex = updatedApplication.requiredDocuments.findIndex(doc => doc.type === documentType);
    
    if (documentIndex !== -1) {
      updatedApplication.requiredDocuments[documentIndex] = {
        ...updatedApplication.requiredDocuments[documentIndex],
        status: 'pending',
        uploadDate: new Date().toISOString(),
        verificationDate: null,
        notes: null
      };
      
      // Add to timeline
      updatedApplication.timeline.push({
        date: new Date().toISOString(),
        action: 'Document Uploaded',
        description: `${documentType.replace(/([A-Z])/g, ' $1').trim()} document uploaded`
      });
      
      // Update state
      setApplication(updatedApplication);
      
      // Close modal and reset form
      setShowDocumentModal(false);
      setDocumentType('');
      setDocumentFile(null);
      setDocumentError('');
      
      // Show success message
      toast.success('Document uploaded successfully');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => navigate('/dashboard/user')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!application || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">Application Not Found</h1>
          <p className="text-gray-700">The application you are looking for does not exist or you do not have permission to view it.</p>
          <button
            onClick={() => navigate('/dashboard/user')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Application Details</h1>
            <p className="text-gray-600">Application ID: {application.id}</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(application.status)} capitalize`}>
              {application.status.replace('_', ' ')}
            </span>
            <button
              onClick={() => navigate('/dashboard/user')}
              className="ml-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        
        {/* Application Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Application Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-gray-600">Application Type:</div>
                <div className="capitalize">{application.type}</div>
                
                <div className="text-gray-600">Status:</div>
                <div className="capitalize">{application.status.replace('_', ' ')}</div>
                
                <div className="text-gray-600">Submitted Date:</div>
                <div>{formatDate(application.submittedDate)}</div>
                
                <div className="text-gray-600">Last Updated:</div>
                <div>{formatDate(application.lastUpdated)}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Property Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-gray-600">Plot Number:</div>
                <div>{property.plotNumber}</div>
                
                <div className="text-gray-600">Property Type:</div>
                <div className="capitalize">{property.propertyType}</div>
                
                <div className="text-gray-600">Area:</div>
                <div>{property.area} sq. meters</div>
                
                <div className="text-gray-600">Location:</div>
                <div>{property.location.subCity} Sub-city, Kebele {property.location.kebele}</div>
              </div>
            </div>
            <div className="mt-4 text-right">
              <Link to={`/property/${property.id}`} className="text-primary hover:underline">
                View Property Details
              </Link>
            </div>
          </div>
        </div>
        
        {/* Required Documents */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Required Documents</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {application.requiredDocuments.map((document, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {document.type.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(document.status)} capitalize`}>
                        {document.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(document.uploadDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(document.verificationDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{document.notes || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary hover:text-primary-dark mr-3">
                        View
                      </button>
                      {document.status === 'rejected' && (
                        <button 
                          onClick={() => {
                            setDocumentType(document.type);
                            setShowDocumentModal(true);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Re-upload
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Payments */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Payments</h2>
          {application.payments && application.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {application.payments.map((payment, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {payment.type.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.amount} {payment.currency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(payment.paymentDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {payment.paymentMethod?.replace('_', ' ') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.reference || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(payment.status)} capitalize`}>
                          {payment.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No payment history available.</p>
          )}
        </div>
        
        {/* Notes */}
        {application.notes && application.notes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <div className="space-y-4">
              {application.notes.map((note, index) => (
                <div key={index} className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{note.from}</div>
                    <div className="text-sm text-gray-500">{formatDate(note.date)}</div>
                  </div>
                  <p className="mt-2">{note.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Timeline */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Application Timeline</h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Timeline events */}
            <div className="space-y-6">
              {application.timeline.map((event, index) => (
                <div key={index} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1.5 w-10 flex items-center justify-center">
                    <div className="w-3.5 h-3.5 bg-primary rounded-full"></div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                      <h3 className="font-medium">{event.action}</h3>
                      <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
                    </div>
                    <p className="text-gray-600 mt-1">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Document Upload Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            
            <form onSubmit={handleDocumentUpload}>
              <div className="mb-4">
                <label className="form-label">Document Type</label>
                <p className="font-medium capitalize">
                  {documentType.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="documentFile" className="form-label">
                  Select File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="documentFile"
                  onChange={handleFileChange}
                  className="form-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                />
                {documentError && (
                  <div className="text-red-500 text-sm mt-1">{documentError}</div>
                )}
                {documentFile && (
                  <div className="text-sm text-green-600 mt-1">
                    File selected: {documentFile.name}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Accepted formats: PDF, JPG, PNG. Maximum file size: 5MB.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDocumentModal(false);
                    setDocumentType('');
                    setDocumentFile(null);
                    setDocumentError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                  disabled={!documentFile || documentError}
                >
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;

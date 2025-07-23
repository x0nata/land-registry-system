import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import * as propertyService from '../../services/propertyService';
import * as userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const Properties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Check if user can approve/reject properties (only land officers)
  const canApproveReject = user?.role === 'landOfficer';

  // Fetch properties on component mount and when filters change
  useEffect(() => {
    fetchProperties();
  }, [currentPage, statusFilter, typeFilter, searchTerm]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch properties from API
      const propertiesData = await propertyService.getAllProperties({
        page: currentPage,
        limit,
        status: statusFilter || undefined,
        propertyType: typeFilter || undefined,
        search: searchTerm || undefined
      });

      // Set properties and pagination
      if (propertiesData && propertiesData.properties) {
        setProperties(propertiesData.properties);
        setTotalPages(propertiesData.pagination?.pages || 1);
      } else if (Array.isArray(propertiesData)) {
        // If response is an array, use it directly
        setProperties(propertiesData);
        setTotalPages(Math.ceil(propertiesData.length / limit) || 1);
      } else {
        // No properties found
        setProperties([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to fetch properties');
      setProperties([]);
      setTotalPages(1);
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProperty = async (propertyId) => {
    try {
      // Find the property in our current list first
      let property = properties.find(p => p._id === propertyId);

      if (!property) {
        // If not found in current list, fetch from API
        property = await propertyService.getPropertyById(propertyId);
      }

      if (property) {
        setSelectedProperty(property);
        setShowPropertyModal(true);
      } else {
        toast.error('Property not found');
      }
    } catch (err) {
      console.error('Error fetching property details:', err);
      toast.error('Failed to fetch property details');
    }
  };

  const handleApproveProperty = async () => {
    try {
      // Approve property via API
      await propertyService.approveProperty(selectedProperty._id, {
        notes: approvalNotes
      });

      setShowApproveModal(false);
      setSelectedProperty(null);
      setApprovalNotes('');
      toast.success('Property approved successfully');

      // Refresh the property list
      fetchProperties();
    } catch (err) {
      console.error('Error approving property:', err);
      toast.error(err.message || 'Failed to approve property');
    }
  };

  const handleRejectProperty = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      // Reject property via API
      await propertyService.rejectProperty(selectedProperty._id, {
        reason: rejectionReason
      });

      setShowRejectModal(false);
      setSelectedProperty(null);
      setRejectionReason('');
      toast.success('Property rejected successfully');

      // Refresh the property list
      fetchProperties();
    } catch (err) {
      console.error('Error rejecting property:', err);
      toast.error(err.message || 'Failed to reject property');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProperties();
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <HomeIcon className="h-7 w-7 mr-2 text-primary" />
            Property Management
          </h1>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-grow">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search by plot number or location..."
                  className="form-input rounded-r-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark flex items-center"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
                  Search
                </button>
              </div>
            </form>
            <div className="w-full md:w-48">
              <select
                className="form-input w-full"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                className="form-input w-full"
                value={typeFilter}
                onChange={handleTypeFilterChange}
              >
                <option value="">All Types</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="agricultural">Agricultural</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2">Loading properties...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plot Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No properties found
                      </td>
                    </tr>
                  ) : (
                    properties.map((property) => (
                      <tr key={property._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {property.plotNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {property.owner?.fullName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {property.owner?.email || 'No email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {property.location?.subCity || 'N/A'}, {property.location?.kebele || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {property.propertyType}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(property.status)}`}>
                            {property.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(property.registrationDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewProperty(property._id)}
                            className="text-primary hover:text-primary-dark mr-3 flex items-center"
                          >
                            <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                          {property.status === 'pending' && canApproveReject && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setShowApproveModal(true);
                                }}
                                className="text-green-600 hover:text-green-800 mr-3 flex items-center"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setShowRejectModal(true);
                                }}
                                className="text-accent hover:text-accent-dark flex items-center"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                          {property.status === 'pending' && !canApproveReject && (
                            <span className="text-gray-500 text-sm italic">
                              View only - Contact Land Officer for approval
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {properties.length} of {totalPages * limit} properties
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Property Details Modal */}
      {showPropertyModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Plot Number</p>
                <p className="font-medium">{selectedProperty.plotNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="font-medium capitalize">{selectedProperty.propertyType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Area (sq. meters)</p>
                <p className="font-medium">{selectedProperty.area}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedProperty.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">
                  {selectedProperty.location?.subCity || 'N/A'}, {selectedProperty.location?.kebele || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registration Date</p>
                <p className="font-medium">{formatDate(selectedProperty.registrationDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <p className="font-medium">{selectedProperty.owner?.fullName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Owner Contact</p>
                <p className="font-medium">{selectedProperty.owner?.email || 'No email'}</p>
              </div>
            </div>

            {selectedProperty.reviewNotes && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Review Notes</p>
                <p className="p-2 bg-gray-50 rounded mt-1">{selectedProperty.reviewNotes}</p>
              </div>
            )}

            {/* Documents Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Documents</h3>
              {selectedProperty.documents && selectedProperty.documents.length > 0 ? (
                <div className="space-y-2">
                  {selectedProperty.documents.map((doc) => (
                    <div key={doc._id} className="p-2 border rounded flex justify-between items-center">
                      <div>
                        <p className="font-medium">{doc.documentType}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded: {formatDate(doc.uploadDate)}
                        </p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          doc.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No documents uploaded</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPropertyModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Property Modal */}
      {showApproveModal && selectedProperty && canApproveReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Approve Property</h2>
            <p className="mb-4">
              Are you sure you want to approve the property with plot number <span className="font-semibold">{selectedProperty.plotNumber}</span>?
            </p>
            <div className="mb-4">
              <label htmlFor="approvalNotes" className="form-label">
                Approval Notes (Optional)
              </label>
              <textarea
                id="approvalNotes"
                className="form-input"
                rows="3"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes or comments about this approval"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveProperty}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Property Modal */}
      {showRejectModal && selectedProperty && canApproveReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Reject Property</h2>
            <p className="mb-4">
              Are you sure you want to reject the property with plot number <span className="font-semibold">{selectedProperty.plotNumber}</span>?
            </p>
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="form-label">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectionReason"
                className="form-input"
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejecting this property"
                required
              ></textarea>
              {!rejectionReason && (
                <p className="text-red-500 text-sm mt-1">Reason is required</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectProperty}
                disabled={!rejectionReason}
                className={`px-4 py-2 rounded-md ${
                  !rejectionReason
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent-dark'
                }`}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;

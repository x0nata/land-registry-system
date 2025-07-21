import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  ArrowRightCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { getUserProperties } from '../../services/propertyService';

const Properties = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Fetch property data
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const userProperties = await getUserProperties();
        console.log('Fetched user properties:', userProperties);
        setProperties(userProperties || []);
        setFilteredProperties(userProperties || []);
      } catch (error) {
        console.error('Error loading properties:', error);
        toast.error('Failed to load properties');
        setProperties([]);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  // Filter properties based on search term, status, and type
  useEffect(() => {
    let filtered = properties;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.plotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.subCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.propertyType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(property => property.status === filterStatus);
    }

    // Filter by type (transferred, disputed, etc.)
    if (filterType !== 'all') {
      switch (filterType) {
        case 'transferred':
          filtered = filtered.filter(property => property.isTransferred);
          break;
        case 'in_transfer':
          filtered = filtered.filter(property => property.currentTransfer);
          break;
        case 'disputed':
          filtered = filtered.filter(property => property.hasActiveDispute);
          break;
        case 'regular':
          filtered = filtered.filter(property => !property.isTransferred && !property.currentTransfer && !property.hasActiveDispute);
          break;
        default:
          break;
      }
    }

    setFilteredProperties(filtered);
  }, [searchTerm, filterStatus, filterType, properties]);

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get transfer status indicator
  const getTransferIndicator = (property) => {
    if (property.hasActiveDispute) {
      return (
        <div className="flex items-center text-red-600 text-xs">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Active Dispute
        </div>
      );
    }
    if (property.isTransferred) {
      return (
        <div className="flex items-center text-green-600 text-xs">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Transferred Property
        </div>
      );
    }
    if (property.currentTransfer) {
      return (
        <div className="flex items-center text-blue-600 text-xs">
          <ClockIcon className="h-3 w-3 mr-1" />
          Transfer in Progress
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[70vh]">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Properties</h1>
          <p className="text-gray-600">Manage your registered properties</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to="/property/register"
            className="btn-primary px-4 py-2 rounded-md flex items-center"
          >
            <PlusCircleIcon className="h-5 w-5 mr-1" />
            Register New Property
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by plot number, location, or type..."
              className="form-input w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="form-input w-full"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              className="form-input w-full"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="regular">Regular Properties</option>
              <option value="transferred">Transferred Properties</option>
              <option value="in_transfer">Transfer in Progress</option>
              <option value="disputed">With Active Disputes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <HomeIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold">No Properties Found</h2>
          <p className="mt-2 text-gray-500">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'You have not registered any properties yet'}
          </p>
          <Link
            to="/property/register"
            className="mt-4 inline-block btn-primary px-4 py-2 rounded-md"
          >
            Register Your First Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div key={property._id || property.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">{property.plotNumber}</h2>
                    <p className="text-gray-600">
                      {property.location.subCity} Sub-city, Kebele {property.location.kebele}
                    </p>
                    {getTransferIndicator(property)}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(property.status)} capitalize`}>
                    {property.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-gray-700">
                    <span className="font-medium">Area:</span> {property.area} sqm
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Type:</span> <span className="capitalize">{property.propertyType}</span>
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Registered:</span> {formatDate(property.registrationDate)}
                  </p>

                  {/* Transfer History Summary */}
                  {property.transferHistory && property.transferHistory.length > 0 && (
                    <p className="text-gray-700">
                      <span className="font-medium">Transfers:</span> {property.transferHistory.length} transfer(s)
                    </p>
                  )}

                  {/* Ownership History Summary */}
                  {property.ownershipHistory && property.ownershipHistory.length > 1 && (
                    <p className="text-gray-700">
                      <span className="font-medium">Previous Owners:</span> {property.ownershipHistory.length - 1}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-1">
                      {property.documents && property.documents.length > 0 ? (
                        property.documents.map((doc, index) => (
                          <span
                            key={doc._id || doc.id || `doc-${index}`}
                            className={`w-3 h-3 rounded-full ${
                              doc.status === 'verified' ? 'bg-green-500' :
                              doc.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                            title={`${doc.type?.replace('_', ' ')}: ${doc.status}`}
                          ></span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No documents uploaded</span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/disputes/submit?property=${property._id || property.id}`}
                        className="text-yellow-600 hover:text-yellow-700 flex items-center text-sm"
                      >
                        <ScaleIcon className="h-4 w-4 mr-1" />
                        Dispute
                      </Link>
                      <Link
                        to={`/property/${property._id || property.id}`}
                        className="text-primary hover:text-primary-dark flex items-center"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Properties;

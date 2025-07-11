import { Link } from 'react-router-dom';

const PropertyCard = ({ property }) => {
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
  
  // Get property type display name
  const getPropertyTypeDisplay = (type) => {
    switch (type) {
      case 'residential':
        return 'Residential';
      case 'commercial':
        return 'Commercial';
      case 'industrial':
        return 'Industrial';
      case 'agricultural':
        return 'Agricultural';
      default:
        return type;
    }
  };
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{property.plotNumber}</h4>
          <p className="text-gray-600">
            {property.location.subCity} Sub-city, Kebele {property.location.kebele}
          </p>
          <p className="text-gray-600">
            Area: {property.area} sqm | Type: <span className="capitalize">{getPropertyTypeDisplay(property.propertyType)}</span>
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(property.status)} capitalize`}>
          {property.status.replace('_', ' ')}
        </span>
      </div>
      
      {/* Documents and Payments Summary */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500">Documents</p>
          <p className="font-semibold">{property.documents?.length || 0}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500">Payments</p>
          <p className="font-semibold">{property.payments?.length || 0}</p>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Registered on {formatDate(property.registrationDate)}
        </span>
        <Link to={`/property/${property._id}`} className="text-ethiopian-green hover:underline">
          View Details
        </Link>
      </div>
      
      {/* Action buttons based on status */}
      {property.status === 'pending' && (
        <div className="mt-4 flex space-x-2">
          <Link
            to={`/property/${property._id}/edit`}
            className="text-sm bg-ethiopian-yellow text-gray-900 px-3 py-1 rounded hover:bg-opacity-90"
          >
            Edit
          </Link>
          <Link
            to={`/property/${property._id}/documents/upload`}
            className="text-sm bg-ethiopian-green text-white px-3 py-1 rounded hover:bg-opacity-90"
          >
            Upload Documents
          </Link>
        </div>
      )}
      
      {property.status === 'approved' && (
        <div className="mt-4">
          <Link
            to={`/property/${property._id}/certificate`}
            className="text-sm bg-ethiopian-green text-white px-3 py-1 rounded hover:bg-opacity-90"
          >
            Download Certificate
          </Link>
        </div>
      )}
      
      {property.status === 'rejected' && property.reviewNotes && (
        <div className="mt-4 p-2 bg-red-50 text-red-700 text-sm rounded">
          <p className="font-semibold">Rejection Reason:</p>
          <p>{property.reviewNotes}</p>
        </div>
      )}
    </div>
  );
};

export default PropertyCard;

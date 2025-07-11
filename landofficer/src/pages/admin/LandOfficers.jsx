import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  UserPlusIcon,
  UserIcon,
  DocumentTextIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getAllUsers, updateUser } from '../../services/userService';
import { getAllProperties } from '../../services/propertyService';

const LandOfficers = () => {
  const [landOfficers, setLandOfficers] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Fetch land officers and pending applications on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch land officers (users with role 'landOfficer')
        try {
          const usersResponse = await getAllUsers({ role: 'landOfficer' });
          console.log('Land officers response:', usersResponse);

          let officers = [];
          if (usersResponse && usersResponse.users && Array.isArray(usersResponse.users)) {
            officers = usersResponse.users;
          } else if (Array.isArray(usersResponse)) {
            officers = usersResponse;
          }

          setLandOfficers(officers);
        } catch (officerError) {
          console.error('Error fetching land officers:', officerError);
          toast.error('Failed to fetch land officers');
          setLandOfficers([]);
        }

        // Fetch pending properties
        try {
          const propertiesResponse = await getAllProperties({ status: 'pending' });
          console.log('Pending properties response:', propertiesResponse);

          let applications = [];
          if (propertiesResponse && propertiesResponse.properties && Array.isArray(propertiesResponse.properties)) {
            applications = propertiesResponse.properties;
          } else if (Array.isArray(propertiesResponse)) {
            applications = propertiesResponse;
          }

          setPendingApplications(applications);
        } catch (propertyError) {
          console.error('Error fetching pending properties:', propertyError);
          toast.error('Failed to fetch pending applications');
          setPendingApplications([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('Failed to fetch data');
        setLoading(false);
        toast.error('Failed to fetch data');
      }
    };

    fetchData();
  }, []);

  const handleViewOfficer = (officerId) => {
    try {
      // Find the officer in our current list
      const officer = landOfficers.find(o => o._id === officerId);
      if (officer) {
        setSelectedOfficer(officer);
        setShowOfficerModal(true);
      } else {
        toast.error('Officer not found');
      }
    } catch (err) {
      setError('Failed to fetch officer details');
      toast.error('Failed to fetch officer details');
    }
  };

  const handleRemoveOfficer = async (officerId) => {
    try {
      // Change the user's role from 'landOfficer' to 'user'
      await updateUser(officerId, { role: 'user' });

      toast.success('Land officer role removed successfully');

      // Update the list
      setLandOfficers(landOfficers.filter(officer => officer._id !== officerId));
    } catch (err) {
      toast.error('Failed to remove land officer role');
    }
  };

  const handleAssignApplication = async () => {
    if (!selectedOfficer || !selectedApplication) return;

    try {
      // In a real implementation, you would have an API endpoint to assign properties
      // For now, we'll simulate this by updating the property with the assigned officer
      // This would typically be: await assignPropertyToOfficer(selectedApplication, selectedOfficer._id);

      setShowAssignModal(false);
      toast.success('Application assigned successfully');

      // Update the pending applications list
      setPendingApplications(pendingApplications.filter(app => app._id !== selectedApplication));

      // Update the officer's assigned applications count
      const updatedOfficers = landOfficers.map(officer => {
        if (officer._id === selectedOfficer._id) {
          return {
            ...officer,
            assignedApplications: (officer.assignedApplications || 0) + 1
          };
        }
        return officer;
      });

      setLandOfficers(updatedOfficers);
    } catch (err) {
      toast.error('Failed to assign application');
    }
  };

  // Calculate workload percentage for each officer
  const calculateWorkload = (assignedApplications) => {
    const maxApplications = 20; // Arbitrary max for visualization
    return Math.min(100, (assignedApplications / maxApplications) * 100);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <UserIcon className="h-7 w-7 mr-2 text-primary" />
            Land Officers Management
          </h1>
          <Link
            to="/admin/users/new"
            className="mt-4 md:mt-0 btn-primary px-4 py-2 rounded-md flex items-center"
          >
            <UserPlusIcon className="h-5 w-5 mr-1" />
            Add New Land Officer
          </Link>
        </div>

        {/* Land Officers List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2">Loading land officers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {landOfficers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No land officers found
              </div>
            ) : (
              landOfficers.map((officer) => (
                <div key={officer._id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">
                          {officer.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold">{officer.fullName}</h3>
                          <p className="text-gray-600">{officer.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Workload</span>
                        <span className="text-sm font-medium">
                          {officer.assignedApplications || 0} applications
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${calculateWorkload(officer.assignedApplications || 0)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-500">Assigned</p>
                        <p className="font-semibold">{officer.assignedApplications || 0}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-500">Completed</p>
                        <p className="font-semibold">{officer.completedApplications || 0}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-between">
                      <button
                        onClick={() => handleViewOfficer(officer._id)}
                        className="text-primary hover:text-primary-dark flex items-center"
                      >
                        <UserIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOfficer(officer);
                          setShowAssignModal(true);
                        }}
                        className="text-secondary hover:text-secondary-dark flex items-center"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        Assign Application
                      </button>
                      <button
                        onClick={() => handleRemoveOfficer(officer._id)}
                        className="text-accent hover:text-accent-dark flex items-center"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Remove Role
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Officer Details Modal */}
      {showOfficerModal && selectedOfficer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Land Officer Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{selectedOfficer.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedOfficer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium">{selectedOfficer.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">National ID</p>
                <p className="font-medium">{selectedOfficer.nationalId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned Applications</p>
                <p className="font-medium">{selectedOfficer.assignedApplications || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed Applications</p>
                <p className="font-medium">{selectedOfficer.completedApplications || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Created</p>
                <p className="font-medium">
                  {new Date(selectedOfficer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowOfficerModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Application Modal */}
      {showAssignModal && selectedOfficer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Assign Application</h2>
            <p className="mb-4">
              Assign a pending application to <span className="font-semibold">{selectedOfficer.fullName}</span>:
            </p>

            {pendingApplications.length === 0 ? (
              <p className="text-gray-500">No pending applications available</p>
            ) : (
              <div className="max-h-60 overflow-y-auto mb-6">
                <div className="space-y-2">
                  {pendingApplications.map((app) => (
                    <div
                      key={app._id}
                      className={`p-3 border rounded-md cursor-pointer ${
                        selectedApplication === app._id ? 'border-primary bg-primary bg-opacity-10' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedApplication(app._id)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{app.owner?.fullName || 'Unknown Owner'}</p>
                          <p className="text-sm text-gray-500">Plot: {app.plotNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs capitalize bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full inline-block">
                            {app.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignApplication}
                disabled={!selectedApplication || pendingApplications.length === 0}
                className={`px-4 py-2 rounded-md ${
                  !selectedApplication || pendingApplications.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandOfficers;

import { useState } from 'react';
import { XMarkIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ComplianceCheckModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    ethiopianLawCompliance: {
      notes: ''
    },
    taxClearance: {
      notes: ''
    },
    fraudPrevention: {
      riskLevel: 'low',
      notes: ''
    }
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(formData);
   onClose();           // close on success
   onClose();           // close on success
    } catch (error) {
      console.error('Error submitting compliance checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-primary mr-2" />
            <h3 className="text-lg font-semibold">Compliance Checks</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ethiopian Law Compliance */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="font-medium text-gray-900">Ethiopian Law Compliance</h4>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <h5 className="font-medium text-blue-900 mb-2">Key Requirements to Verify:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Property ownership documentation is authentic and complete</li>
                <li>• Transfer complies with Ethiopian Civil Code provisions</li>
                <li>• All parties have legal capacity to enter into the transaction</li>
                <li>• Transfer type is legally permissible under Ethiopian law</li>
                <li>• Required government approvals and permits are obtained</li>
                <li>• Transfer does not violate land use regulations</li>
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compliance Notes
              </label>
              <textarea
                value={formData.ethiopianLawCompliance.notes}
                onChange={(e) => handleInputChange('ethiopianLawCompliance', 'notes', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                placeholder="Enter notes about Ethiopian law compliance verification..."
              />
            </div>
          </div>

          {/* Tax Clearance */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <ShieldCheckIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <h4 className="font-medium text-gray-900">Tax Clearance</h4>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <h5 className="font-medium text-yellow-900 mb-2">Tax Verification Requirements:</h5>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Property tax payments are current and up-to-date</li>
                <li>• Capital gains tax obligations are addressed</li>
                <li>• Transfer tax calculations are accurate</li>
                <li>• Tax clearance certificates are valid and authentic</li>
                <li>• No outstanding tax liens on the property</li>
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Clearance Notes
              </label>
              <textarea
                value={formData.taxClearance.notes}
                onChange={(e) => handleInputChange('taxClearance', 'notes', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                placeholder="Enter notes about tax clearance verification..."
              />
            </div>
          </div>

          {/* Fraud Prevention */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <h4 className="font-medium text-gray-900">Fraud Prevention Assessment</h4>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <h5 className="font-medium text-red-900 mb-2">Fraud Risk Indicators:</h5>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Unusual transaction patterns or timing</li>
                <li>• Inconsistencies in documentation or signatures</li>
                <li>• Parties with questionable backgrounds or credentials</li>
                <li>• Suspicious financial arrangements or funding sources</li>
                <li>• Property value discrepancies or market anomalies</li>
                <li>• Pressure for expedited processing without justification</li>
              </ul>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Level Assessment
                </label>
                <select
                  value={formData.fraudPrevention.riskLevel}
                  onChange={(e) => handleInputChange('fraudPrevention', 'riskLevel', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                >
                  <option value="low">Low Risk - Standard transaction with no red flags</option>
                  <option value="medium">Medium Risk - Some concerns requiring additional review</option>
                  <option value="high">High Risk - Significant concerns requiring thorough investigation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fraud Prevention Notes
                </label>
                <textarea
                  value={formData.fraudPrevention.notes}
                  onChange={(e) => handleInputChange('fraudPrevention', 'notes', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter detailed notes about fraud risk assessment..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Complete Compliance Checks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplianceCheckModal;

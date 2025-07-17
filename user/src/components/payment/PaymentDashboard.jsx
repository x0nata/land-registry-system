import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { PaymentStatusBadge } from './PaymentStatusIndicator';
import PaymentHistory from './PaymentHistory';

const PaymentDashboard = ({ userId = null, isLandOfficer = false }) => {
  const [paymentStats, setPaymentStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentStatistics();
  }, [userId]);

  const fetchPaymentStatistics = async () => {
    try {
      const response = await fetch('/api/payments/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentStats(result.statistics);
        setRecentPayments(result.recentPayments || []);
      } else {
        toast.error('Failed to fetch payment statistics');
      }
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      toast.error('Error loading payment statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} ETB`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Payments',
      value: paymentStats?.totalPayments || 0,
      icon: CurrencyDollarIcon,
      color: 'blue',
      format: 'number'
    },
    {
      title: 'Total Amount',
      value: paymentStats?.totalAmount || 0,
      icon: ChartBarIcon,
      color: 'green',
      format: 'currency'
    },
    {
      title: 'Completed',
      value: paymentStats?.completedPayments || 0,
      icon: CheckCircleIcon,
      color: 'green',
      format: 'number'
    },
    {
      title: 'Pending',
      value: paymentStats?.pendingPayments || 0,
      icon: ClockIcon,
      color: 'yellow',
      format: 'number'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <IconComponent className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.format === 'currency' ? formatCurrency(stat.value) : stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Method Breakdown */}
      {paymentStats?.paymentMethodBreakdown && paymentStats.paymentMethodBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Payment Methods
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentStats.paymentMethodBreakdown.map((method, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {method._id === 'cbe_birr' ? 'CBE Birr' : 
                     method._id === 'telebirr' ? 'TeleBirr' : 
                     method._id}
                  </h4>
                  <span className="text-sm text-gray-500">{method.count} payments</span>
                </div>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(method.totalAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Recent Payments
          </h3>
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div key={payment._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <PaymentStatusBadge status={payment.status} size="sm" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {payment.property?.plotNumber || 'Unknown Property'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {payment.paymentMethod === 'cbe_birr' ? 'CBE Birr' : 
                     payment.paymentMethod === 'telebirr' ? 'TeleBirr' : 
                     payment.paymentMethod}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Trends (if land officer) */}
      {isLandOfficer && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
            Payment Trends
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Average Payment Amount</h4>
              <p className="text-2xl font-semibold text-blue-600">
                {formatCurrency(paymentStats?.averageAmount || 0)}
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Success Rate</h4>
              <p className="text-2xl font-semibold text-green-600">
                {paymentStats?.totalPayments > 0 
                  ? Math.round((paymentStats.completedPayments / paymentStats.totalPayments) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full Payment History */}
      <PaymentHistory propertyId={null} userId={userId} />

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Payment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Supported Payment Methods:</h4>
            <ul className="space-y-1">
              <li>• CBE Birr - Direct bank transfer</li>
              <li>• TeleBirr - Mobile wallet payment</li>
              <li>• Chapa - Credit/debit cards</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Payment Process:</h4>
            <ul className="space-y-1">
              <li>• Submit property documents</li>
              <li>• Wait for document validation</li>
              <li>• Complete payment when required</li>
              <li>• Await final approval</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDashboard;

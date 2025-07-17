import React from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const PaymentStatusIndicator = ({ status, amount, currency = 'ETB', size = 'md', showAmount = true }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircleIcon,
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          label: 'Payment Completed',
          description: 'Payment has been successfully processed'
        };
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'yellow',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          label: 'Payment Pending',
          description: 'Payment is being processed'
        };
      case 'processing':
        return {
          icon: ArrowPathIcon,
          color: 'blue',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          label: 'Processing Payment',
          description: 'Payment is currently being processed'
        };
      case 'failed':
        return {
          icon: XCircleIcon,
          color: 'red',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          label: 'Payment Failed',
          description: 'Payment could not be processed'
        };
      case 'refunded':
        return {
          icon: ArrowPathIcon,
          color: 'purple',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-200',
          label: 'Payment Refunded',
          description: 'Payment has been refunded'
        };
      case 'cancelled':
        return {
          icon: XCircleIcon,
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          label: 'Payment Cancelled',
          description: 'Payment was cancelled'
        };
      case 'required':
        return {
          icon: CurrencyDollarIcon,
          color: 'orange',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200',
          label: 'Payment Required',
          description: 'Payment is required to proceed'
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          label: 'Unknown Status',
          description: 'Payment status is unknown'
        };
    }
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-2',
          icon: 'h-4 w-4',
          text: 'text-xs',
          amount: 'text-sm font-medium'
        };
      case 'lg':
        return {
          container: 'p-4',
          icon: 'h-8 w-8',
          text: 'text-base',
          amount: 'text-xl font-bold'
        };
      default: // md
        return {
          container: 'p-3',
          icon: 'h-6 w-6',
          text: 'text-sm',
          amount: 'text-lg font-semibold'
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);
  const IconComponent = config.icon;

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} ${sizeClasses.container}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <IconComponent 
            className={`${sizeClasses.icon} ${config.textColor} ${
              status === 'processing' ? 'animate-spin' : ''
            }`} 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`font-medium ${config.textColor} ${sizeClasses.text}`}>
              {config.label}
            </p>
            {showAmount && amount && (
              <p className={`${config.textColor} ${sizeClasses.amount}`}>
                {amount.toLocaleString()} {currency}
              </p>
            )}
          </div>
          {size !== 'sm' && (
            <p className={`text-gray-600 ${sizeClasses.text} mt-1`}>
              {config.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Compact version for use in tables or lists
export const PaymentStatusBadge = ({ status, size = 'sm' }) => {
  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs' 
    : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses}`}>
      <IconComponent className={`mr-1 ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} ${
        status === 'processing' ? 'animate-spin' : ''
      }`} />
      {config.label}
    </span>
  );
};

// Progress indicator for payment workflow
export const PaymentWorkflowProgress = ({ currentStep, steps }) => {
  const defaultSteps = [
    { id: 'documents', label: 'Documents Validated', status: 'completed' },
    { id: 'payment', label: 'Payment Required', status: 'current' },
    { id: 'approval', label: 'Awaiting Approval', status: 'pending' },
    { id: 'complete', label: 'Registration Complete', status: 'pending' }
  ];

  const workflowSteps = steps || defaultSteps;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Progress</h3>
      
      <div className="space-y-4">
        {workflowSteps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isPending = step.status === 'pending';
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${
                  isCompleted ? 'text-green-600' : 
                  isCurrent ? 'text-blue-600' : 
                  'text-gray-500'
                }`}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                )}
              </div>
              
              {index < workflowSteps.length - 1 && (
                <div className={`absolute left-4 mt-8 w-0.5 h-4 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`} style={{ marginLeft: '15px' }}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function used by badge component
const getStatusConfig = (status) => {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircleIcon,
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        label: 'Completed'
      };
    case 'pending':
      return {
        icon: ClockIcon,
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        label: 'Pending'
      };
    case 'processing':
      return {
        icon: ArrowPathIcon,
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        label: 'Processing'
      };
    case 'failed':
      return {
        icon: XCircleIcon,
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        label: 'Failed'
      };
    case 'refunded':
      return {
        icon: ArrowPathIcon,
        color: 'purple',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200',
        label: 'Refunded'
      };
    case 'cancelled':
      return {
        icon: XCircleIcon,
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        label: 'Cancelled'
      };
    case 'required':
      return {
        icon: CurrencyDollarIcon,
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200',
        label: 'Required'
      };
    default:
      return {
        icon: ExclamationTriangleIcon,
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        label: 'Unknown'
      };
  }
};

export default PaymentStatusIndicator;

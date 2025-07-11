import React from 'react';

const RoleBadge = ({ role, size = 'sm' }) => {
  const getRoleConfig = (role) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'landOfficer':
        return {
          label: 'Land Officer',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'user':
        return {
          label: 'User',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      default:
        return {
          label: 'Unknown',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case 'xs':
        return 'px-1.5 py-0.5 text-xs';
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-2.5 py-1.5 text-sm';
      case 'lg':
        return 'px-3 py-2 text-base';
      default:
        return 'px-2 py-1 text-xs';
    }
  };

  const config = getRoleConfig(role);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses}
      `}
    >
      {config.label}
    </span>
  );
};

export default RoleBadge;

import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ErrorMessage = ({ 
  message = 'An error occurred', 
  title = 'Error',
  variant = 'default',
  onRetry = null,
  className = ''
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'warning':
        return 'text-yellow-500';
      case 'danger':
        return 'text-red-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getVariantClasses()} ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          <ExclamationTriangleIcon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold mb-1">{title}</h3>
          <p className="text-sm">{message}</p>
          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="text-sm font-medium underline hover:no-underline focus:outline-none"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
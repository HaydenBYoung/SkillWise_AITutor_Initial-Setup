import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ErrorMessage = ({ 
  message = 'An error occurred', 
  title = 'Error',
  variant = 'default',
  onRetry = null,
  onDismiss = null,
  className = ''
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200';
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'warning':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'danger':
        return 'text-red-500 dark:text-red-400';
      case 'info':
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-red-500 dark:text-red-400';
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getVariantClasses()} ${className} relative`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          <ExclamationTriangleIcon className="h-4 w-4" />
        </div>
        <div className="ml-2 flex-1">
          <h3 className="text-sm font-medium mb-1">{title}</h3>
          <p className="text-sm opacity-90">{message}</p>
          {onRetry && (
            <div className="mt-2">
              <button
                onClick={onRetry}
                className="text-sm font-medium underline hover:no-underline focus:outline-none"
              >
                Try again
              </button>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
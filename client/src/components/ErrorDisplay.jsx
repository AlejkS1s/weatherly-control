import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

const ErrorDisplay = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 mr-2" />
          <span className="font-medium">Error:</span>
          <span className="ml-1">{error}</span>
        </div>
        <button 
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 transition-colors"
          aria-label="Dismiss error"
        >
          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
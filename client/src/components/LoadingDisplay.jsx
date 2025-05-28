import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const LoadingDisplay = ({ loading, message = "Loading environmental data..." }) => {
  if (!loading) return null;

  return (
    <div className="mb-6 flex items-center justify-center py-8 bg-white rounded-lg shadow-sm border">
      <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-blue-500 animate-spin mr-3" />
      <span className="text-gray-600 font-medium">{message}</span>
    </div>
  );
};

export default LoadingDisplay;
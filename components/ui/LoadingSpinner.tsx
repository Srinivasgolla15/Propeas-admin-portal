import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
      <span className="ml-4 text-blue-500 font-medium text-lg">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;


import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white mt-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} AI Exterior Design Visualizer. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

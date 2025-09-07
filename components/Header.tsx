
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md w-full">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Exterior AI Designer
        </h1>
        <p className="mt-1 text-md text-gray-500">
          Visualize your home's new look, powered by AI.
        </p>
      </div>
    </header>
  );
};

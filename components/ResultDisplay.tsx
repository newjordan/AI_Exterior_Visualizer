import React from 'react';

interface ResultDisplayProps {
  originalImageUrl: string;
  generatedImageUrl: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImageUrl, generatedImageUrl }) => {
  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-center text-slate-100 mb-8">Your Transformation</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-xl p-4 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-2xl">
          <h3 className="text-xl font-semibold text-center text-slate-300 mb-4">Original</h3>
          <img src={originalImageUrl} alt="Original home" className="rounded-lg w-full h-auto" />
        </div>
        <div className="rounded-xl p-4 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-2xl">
          <h3 className="text-xl font-semibold text-center text-blue-300 mb-4">AI Visualization</h3>
          <img src={generatedImageUrl} alt="AI generated home design" className="rounded-lg w-full h-auto" />
        </div>
      </div>
    </div>
  );
};

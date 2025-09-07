import React from 'react';
import { Loader } from './Loader';
import type { MaskingProgress, HouseMasks } from '../types';

interface MaskingScreenProps {
  progress: MaskingProgress | null;
  masks: HouseMasks;
}

const StatusIndicator: React.FC<{ status: 'pending' | 'generating' | 'complete' | 'error' }> = ({ status }) => {
    switch (status) {
        case 'generating':
            return <div className="flex items-center gap-2"><Loader size="sm" /><span className="text-slate-400">Analyzing...</span></div>;
        case 'complete':
            return <div className="flex items-center gap-2 text-green-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>Done</span></div>;
        case 'error':
            return <div className="flex items-center gap-2 text-red-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg><span>Error</span></div>;
        case 'pending':
        default:
            return <span className="text-slate-500">Pending...</span>;
    }
};

export const MaskingScreen: React.FC<MaskingScreenProps> = ({ progress, masks }) => {
  const elements = progress ? Object.keys(progress) as (keyof HouseMasks)[] : [];

  return (
    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl rounded-xl p-8 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 shadow-2xl">
        <div className="flex justify-center mb-6">
            <Loader size="lg" />
        </div>
        <h2 className="text-3xl font-bold text-slate-100">Analyzing Your Home</h2>
        <p className="text-lg text-slate-300 mt-2 mb-8">
          Our AI is creating a digital blueprint of your house.
        </p>

        <div className="space-y-4 text-left">
            {elements.map(element => (
                <div key={element} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <span className="text-lg font-medium capitalize text-slate-200">{element}</span>
                    <div className="flex items-center gap-4">
                        {progress && progress[element] === 'complete' && masks[element] && (
                            <img 
                                src={`data:image/png;base64,${masks[element]}`} 
                                alt={`${element} mask preview`}
                                className="w-12 h-12 rounded-md bg-white p-1 object-contain border border-slate-600"
                                title="Generated Mask Preview"
                            />
                        )}
                        {progress && <StatusIndicator status={progress[element]} />}
                    </div>
                </div>
            ))}
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

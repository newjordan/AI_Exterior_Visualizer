import React, { Fragment } from 'react';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Here's Your New Look!</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">Close modal</span>
            </button>
        </div>
        <div className="p-4 flex-grow overflow-auto">
            {imageUrl ? (
                <img src={imageUrl} alt="AI generated home exterior" className="w-full h-auto object-contain rounded-lg" />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Loading image...</p>
                </div>
            )}
        </div>
        <div className="p-4 border-t text-right">
            <button
                onClick={onClose}
                className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
                Close
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
            from {
                transform: scale(0.95);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }
        .animate-fade-in-scale {
            animation: fade-in-scale 0.3s forwards;
        }
      `}</style>
    </div>
  );
};

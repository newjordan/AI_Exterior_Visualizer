import React from 'react';

interface ResultModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ imageUrl, onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-heading"
    >
      <div 
        className="relative max-w-4xl w-11/12 max-h-[90vh] p-4 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700/50 shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
             <h2 id="result-heading" className="text-2xl font-bold text-blue-300">Here's Your New Look!</h2>
             <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-400"
                aria-label="Close visualization"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
        </div>
        <img src={imageUrl} alt="AI generated home design" className="rounded-lg w-full h-auto object-contain max-h-[75vh]" />
      </div>
      {/* FIX: Replaced non-standard <style jsx global> with a standard <style> tag to resolve TypeScript error. */}
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

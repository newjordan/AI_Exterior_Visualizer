import React from 'react';

interface HeaderProps {
  onReset: () => void;
  showReset: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, showReset }) => {
  return (
    <header className="bg-transparent border-b border-slate-700/50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-100 tracking-wider">
          AI Exterior <span className="text-blue-400">Designer</span>
        </h1>
        {showReset && (
           <button 
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
           >
              Start Over
           </button>
        )}
      </div>
    </header>
  );
};

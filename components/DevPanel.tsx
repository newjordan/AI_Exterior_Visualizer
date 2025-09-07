import React, { useState } from 'react';
import type { HouseMasks, MaskingProgress } from '../types';
import { Loader } from './Loader';

// FIX: This component was missing. Implemented DevPanel to view masks and trigger regeneration.
interface DevPanelProps {
  originalImage: string;
  masks: HouseMasks;
  onClose: () => void;
  onRegenerate: (element: keyof HouseMasks) => void;
  progress: MaskingProgress | null;
}

/**
 * A component to display a single mask preview and its controls.
 */
const MaskPreview: React.FC<{
    element: keyof HouseMasks;
    maskData?: string;
    onRegenerate: () => void;
    isGenerating: boolean;
}> = ({ element, maskData, onRegenerate, isGenerating }) => {
    return (
        <div className="bg-slate-700/50 p-4 rounded-lg flex flex-col">
            <h4 className="text-lg font-semibold capitalize mb-3 text-slate-200">{element}</h4>
            <div className="aspect-square w-full bg-slate-800 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                {maskData ? (
                    <img src={`data:image/png;base64,${maskData}`} alt={`${element} mask`} className="object-contain w-full h-full" />
                ) : (
                    <span className="text-sm text-slate-400">No mask generated</span>
                )}
            </div>
            <button
                onClick={onRegenerate}
                disabled={isGenerating}
                className="w-full mt-auto bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-sm"
            >
                {isGenerating ? (
                    <>
                        <Loader size="xs" />
                        <span className="ml-2">Generating...</span>
                    </>
                ) : (
                    'Regenerate'
                )}
            </button>
        </div>
    );
};

/**
 * The DevPanel component provides a UI for developers to inspect the generated masks
 * and re-trigger mask generation for specific elements of the house.
 */
export const DevPanel: React.FC<DevPanelProps> = ({
  originalImage,
  masks,
  onClose,
  onRegenerate,
  progress,
}) => {
  const [activeTab, setActiveTab] = useState<'masks' | 'original'>('masks');
  const elements = ['siding', 'roofing', 'trim', 'door'] as (keyof HouseMasks)[];

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex justify-end animate-fade-in">
      <div
        className="relative w-full max-w-lg h-full bg-slate-800 shadow-2xl border-l border-slate-700 flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-slate-700">
          <h2 id="dev-panel-title" className="text-xl font-bold text-slate-100">
            Developer Panel
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            aria-label="Close developer panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <nav className="flex-shrink-0 border-b border-slate-700">
          <div className="flex space-x-2 px-4">
            <button
              onClick={() => setActiveTab('masks')}
              className={`py-3 px-4 font-medium text-sm transition-colors ${
                activeTab === 'masks'
                  ? 'border-b-2 border-blue-400 text-blue-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Generated Masks
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`py-3 px-4 font-medium text-sm transition-colors ${
                activeTab === 'original'
                  ? 'border-b-2 border-blue-400 text-blue-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Original Image
            </button>
          </div>
        </nav>

        <main className="flex-grow overflow-y-auto p-4">
          {activeTab === 'masks' && (
            <div className="grid grid-cols-2 gap-4">
              {elements.map((element) => (
                <MaskPreview
                  key={element}
                  element={element}
                  maskData={masks[element]}
                  onRegenerate={() => onRegenerate(element)}
                  isGenerating={progress?.[element] === 'generating'}
                />
              ))}
            </div>
          )}
          {activeTab === 'original' && (
            <div>
              <img src={originalImage} alt="Original house" className="rounded-lg w-full" />
            </div>
          )}
        </main>
      </div>
       {/* Animations to match other modals in the application */}
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slide-in-right {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

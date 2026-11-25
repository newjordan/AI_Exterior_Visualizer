import { useEffect, useRef } from 'react';
import type { HouseMasks, MaskingProgress } from '../types';
import { Loader } from './Loader';

interface DevPanelProps {
  originalImage: string;
  masks: HouseMasks;
  onClose: () => void;
  onRegenerate: (element: keyof HouseMasks) => void;
  progress: MaskingProgress | null;
}

const elements: (keyof HouseMasks)[] = ['siding', 'roofing', 'trim', 'door'];

const MaskPreview = ({
  element,
  maskData,
  onRegenerate,
  isGenerating,
}: {
  element: keyof HouseMasks;
  maskData?: string;
  onRegenerate: () => void;
  isGenerating: boolean;
}) => (
  <div className="flex flex-col rounded-xl bg-slate-800/80 p-4">
    <h3 className="mb-3 text-base font-semibold capitalize text-slate-100">{element}</h3>
    <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-slate-950">
      {maskData ? (
        <img src={`data:image/png;base64,${maskData}`} alt={`${element} mask`} className="h-full w-full object-contain" />
      ) : (
        <span className="px-3 text-center text-sm text-slate-300">No mask yet</span>
      )}
    </div>
    <button
      type="button"
      onClick={onRegenerate}
      disabled={isGenerating}
      className="mt-auto inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
    >
      {isGenerating ? (
        <>
          <Loader size="xs" />
          <span className="ml-2">Generating</span>
        </>
      ) : (
        'Regenerate'
      )}
    </button>
  </div>
);

export const DevPanel = ({ originalImage, masks, onClose, onRegenerate, progress }: DevPanelProps) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = 'mask-inspector-title';

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/70" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-full w-full max-w-lg flex-col border-l border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-700 px-4 py-4">
          <h2 id={titleId} className="text-xl font-semibold text-slate-50">
            Mask inspector
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <img src={originalImage} alt="House being edited" className="mb-4 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
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
        </div>
      </div>
    </div>
  );
};

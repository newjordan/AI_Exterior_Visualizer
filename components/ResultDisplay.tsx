import { useEffect, useRef, useState } from 'react';

interface ResultDisplayProps {
  originalImageUrl: string;
  generatedImageUrl: string;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const ResultDisplay = ({ originalImageUrl, generatedImageUrl }: ResultDisplayProps) => {
  const [revealState, setRevealState] = useState<'countdown' | 'fading' | 'revealed'>(() =>
    prefersReducedMotion() ? 'revealed' : 'countdown',
  );
  const [countdown, setCountdown] = useState(3);
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (revealState !== 'countdown') return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
      return () => clearTimeout(timer);
    }
    const fadeTimer = setTimeout(() => setRevealState('fading'), 400);
    return () => clearTimeout(fadeTimer);
  }, [countdown, revealState]);

  useEffect(() => {
    if (revealState !== 'fading') return;
    const timer = setTimeout(() => setRevealState('revealed'), prefersReducedMotion() ? 0 : 1200);
    return () => clearTimeout(timer);
  }, [revealState]);

  const updateFromClientX = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const percentage = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const nudge = (delta: number) => {
    setSliderPosition((current) => Math.min(100, Math.max(0, current + delta)));
  };

  const saveImage = () => {
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `home-transformation-${Date.now()}.png`;
    link.click();
  };

  if (revealState !== 'revealed') {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-8">
        <h2 className="text-3xl font-semibold text-slate-50">Your transformation</h2>
        <p className="sr-only" role="status">
          Revealing the redesigned exterior.
        </p>
        <div className="relative mt-6 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
          <img src={generatedImageUrl} alt="Redesigned home" className="max-h-[75vh] w-full object-contain" />
          <img
            src={originalImageUrl}
            alt=""
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-1000 ${
              revealState === 'fading' ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {revealState === 'countdown' && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35" aria-hidden="true">
              <span className="text-8xl font-semibold text-white">{countdown}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setRevealState('revealed')}
          className="mt-4 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          Skip reveal
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h2 className="text-center text-3xl font-semibold text-slate-50">Your transformation</h2>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={saveImage}
          className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Save result
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto mt-6 max-w-6xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950"
        onPointerDown={(event) => {
          if (event.target instanceof Element && event.target.closest('[data-slider-handle]')) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromClientX(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          updateFromClientX(event.clientX);
        }}
      >
        <img src={generatedImageUrl} alt="Redesigned home" className="block max-h-[75vh] w-full object-contain" />
        <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
          <img src={originalImageUrl} alt="" className="h-full w-full object-contain" />
        </div>
        <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-slate-950/75 px-2 py-1 text-xs font-semibold text-white">
          Before
        </div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-slate-950/75 px-2 py-1 text-xs font-semibold text-white">
          After
        </div>
        <button
          type="button"
          data-slider-handle
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPosition)}
          aria-label="Comparison position"
          aria-describedby="compare-help"
          className="absolute top-0 bottom-0 w-11 -translate-x-1/2 cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
          onPointerDown={(event) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            updateFromClientX(event.clientX);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              nudge(-5);
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              nudge(5);
            } else if (event.key === 'Home') {
              event.preventDefault();
              setSliderPosition(0);
            } else if (event.key === 'End') {
              event.preventDefault();
              setSliderPosition(100);
            }
          }}
        >
          <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white" />
          <span className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900 shadow">
            ↔
          </span>
        </button>
      </div>
      <p id="compare-help" className="mt-3 text-center text-sm text-slate-300">
        Drag the handle, or focus it and use the arrow keys, to compare before and after. Saving downloads the full image.
      </p>
    </div>
  );
};


import React, { useState, useEffect } from 'react';

interface ResultDisplayProps {
  originalImageUrl: string;
  generatedImageUrl: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImageUrl, generatedImageUrl }) => {
  const [revealState, setRevealState] = useState<'countdown' | 'fading' | 'revealed'>('countdown');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (revealState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        // When countdown finishes, start fading
        const fadeTimer = setTimeout(() => setRevealState('fading'), 500);
        return () => clearTimeout(fadeTimer);
      }
    }
  }, [countdown, revealState]);

  useEffect(() => {
    if (revealState === 'fading') {
      // After fade animation duration (2s), show the final revealed state
      const revealTimer = setTimeout(() => setRevealState('revealed'), 2000);
      return () => clearTimeout(revealTimer);
    }
  }, [revealState]);
  
  // Preload images to ensure smooth transition
  useEffect(() => {
    const originalImg = new Image();
    originalImg.src = originalImageUrl;
    const generatedImg = new Image();
    generatedImg.src = generatedImageUrl;
  }, [originalImageUrl, generatedImageUrl]);


  if (revealState !== 'revealed') {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center animate-fade-in-fast">
        <div className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-700/50">
           {/* Generated image is underneath */}
           <img src={generatedImageUrl} alt="AI generated home design" className="absolute inset-0 w-full h-full object-cover" />
           
           {/* Original image is on top and will fade away */}
           <img 
              src={originalImageUrl} 
              alt="Original home" 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-2000 ease-in-out ${revealState === 'fading' ? 'opacity-0' : 'opacity-100'}`} 
           />
           
           {/* Countdown Overlay */}
           {revealState === 'countdown' && countdown > 0 && (
              <div key={countdown} className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="text-9xl font-bold text-white animate-scale-up-fade-out">{countdown}</span>
              </div>
           )}
        </div>
        <style>{`
            @keyframes fade-in-fast {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .animate-fade-in-fast { animation: fade-in-fast 0.5s ease-out forwards; }

            @keyframes scale-up-fade-out {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1.2); opacity: 0; }
            }
            .animate-scale-up-fade-out { animation: scale-up-fade-out 1s ease-in-out forwards; }
            .duration-2000 { transition-duration: 2000ms; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="mt-12 animate-fade-in-fast">
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

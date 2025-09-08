import React, { useState, useEffect, useRef } from 'react';

interface ResultDisplayProps {
  originalImageUrl: string;
  generatedImageUrl: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImageUrl, generatedImageUrl }) => {
  const [revealState, setRevealState] = useState<'countdown' | 'fading' | 'revealed'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // This useEffect must always be called, not conditionally
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.min(100, Math.max(0, percentage)));
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleSaveImage = () => {
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `home-transformation-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewFullImage = () => {
    // Open generated image in new tab
    window.open(generatedImageUrl, '_blank');
  };

  if (revealState !== 'revealed') {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center animate-fade-in-fast p-4">
        <div className="relative max-w-6xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-800">
           {/* Generated image is underneath */}
           <img src={generatedImageUrl} alt="AI generated home design" className="block max-w-full max-h-[90vh] object-contain" />
           
           {/* Original image is on top and will fade away */}
           <img 
              src={originalImageUrl} 
              alt="Original home" 
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-2000 ease-in-out ${revealState === 'fading' ? 'opacity-0' : 'opacity-100'}`} 
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
    <div className="mt-8 animate-fade-in-fast pb-8">
      <h2 className="text-3xl font-bold text-center text-slate-100 mb-8">Your Transformation</h2>
      
      {/* Action buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={handleSaveImage}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Save Result
        </button>
        <button
          onClick={handleViewFullImage}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Full Size
        </button>
      </div>

      <div className="mx-auto px-4">
        {/* Comparison slider */}
        <div 
          ref={containerRef}
          className="relative w-full rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 select-none cursor-ew-resize bg-slate-800 max-w-7xl mx-auto"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          {/* AI Visualization (bottom layer) - this sets the container size */}
          <img 
            src={generatedImageUrl} 
            alt="AI Visualization" 
            className="block w-full h-auto"
          />
          
          {/* Original Image (top layer with clip) */}
          <div 
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img 
              src={originalImageUrl} 
              alt="Original" 
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Slider Handle */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            onMouseDown={handleMouseDown}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </div>
          
          {/* Labels */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
            <span className="text-white text-sm font-semibold">Original</span>
          </div>
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
            <span className="text-white text-sm font-semibold">AI Visualization</span>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="text-center mt-4">
          <p className="text-slate-400 text-sm">Drag the slider to compare before and after</p>
        </div>

        {/* Full Generated Image Display - No width constraints */}
        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-center text-slate-100 mb-6">Final Result</h3>
          <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-800 w-fit mx-auto">
            <img 
              src={generatedImageUrl} 
              alt="Final AI Visualization" 
              className="block max-w-none h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
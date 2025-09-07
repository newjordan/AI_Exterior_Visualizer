import React, { useEffect, useState } from 'react';

interface AiScanProps {
  imageUrl: string;
  onScanComplete: () => void;
}

const scanSteps = [
    "Initializing AI model...",
    "Analyzing image composition...",
    "Detecting architectural lines...",
    "Identifying siding surfaces...",
    "Tagging roofing materials...",
    "Mapping trim and windows...",
    "Locating entryways...",
    "Finalizing structural analysis...",
    "Ready for design!",
];

export const AiScan: React.FC<AiScanProps> = ({ imageUrl, onScanComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const stepInterval = 400;
        const totalDuration = scanSteps.length * stepInterval;

        const stepTimer = setInterval(() => {
            setCurrentStep(prev => {
                if (prev < scanSteps.length - 1) {
                    return prev + 1;
                }
                clearInterval(stepTimer);
                return prev;
            });
        }, stepInterval);
        
        const progressTimer = setInterval(() => {
            setProgress(p => p + 100 / (totalDuration / 100));
        }, 100);

        const completionTimer = setTimeout(() => {
            setProgress(100);
            onScanComplete();
        }, totalDuration + 200);

        return () => {
            clearInterval(stepTimer);
            clearInterval(progressTimer);
            clearTimeout(completionTimer);
        };
    }, [onScanComplete]);

    return (
        <div className="w-full flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">AI is Analyzing Your Home</h2>
            <div className="relative w-full max-w-2xl aspect-[4/3] rounded-xl shadow-2xl overflow-hidden">
                <img src={imageUrl} alt="House being scanned" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute inset-0 border-4 border-blue-500/50 rounded-xl animate-pulse"></div>
            </div>
            <div className="w-full max-w-2xl mt-8">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}></div>
                </div>
                <p className="text-center text-lg text-gray-600 mt-4 h-8 transition-all duration-300">
                   {scanSteps[currentStep]}
                </p>
            </div>
        </div>
    );
};

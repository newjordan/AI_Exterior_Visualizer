import React, { useEffect, useState } from 'react';

interface AiScanProps {
  imageUrl: string;
  onScanComplete: () => void;
}

export const AiScan: React.FC<AiScanProps> = ({ imageUrl, onScanComplete }) => {
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("Analyzing image composition...");

    useEffect(() => {
        const messages = [
            "Identifying architectural elements...",
            "Mapping surfaces: siding, roof, trim...",
            "Calibrating light and shadow...",
            "Preparing your design canvas...",
        ];

        const interval = setInterval(() => {
            setProgress(prev => {
                const nextProgress = prev + 1;
                if (nextProgress >= 100) {
                    clearInterval(interval);
                    setTimeout(onScanComplete, 500);
                    setMessage("Analysis complete!");
                    return 100;
                }
                
                const messageIndex = Math.floor(nextProgress / (100 / messages.length));
                setMessage(messages[messageIndex] || messages[messages.length - 1]);

                return nextProgress;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [onScanComplete]);

    return (
        <div className="flex-grow flex flex-col items-center justify-center text-center">
            <div className="relative w-full max-w-xl mx-auto">
                <div className="absolute -inset-2 rounded-xl bg-blue-500 opacity-20 animate-pulse blur-xl"></div>
                <img src={imageUrl} alt="House being scanned" className="relative rounded-xl shadow-2xl w-full" />
            </div>
            <div className="w-full max-w-xl mx-auto mt-12">
                <h2 className="text-2xl font-semibold text-slate-200 mb-4">{message}</h2>
                <div className="w-full bg-slate-700/50 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}></div>
                </div>
            </div>
        </div>
    );
};

import React, { useCallback, useRef } from 'react';
import { DEFAULT_HOUSE_IMAGE_URL } from '../constants';

interface InitialScreenProps {
    onImageSelected: (file: File | 'default') => void;
}

export const InitialScreen: React.FC<InitialScreenProps> = ({ onImageSelected }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageSelected(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleDefaultClick = () => {
        onImageSelected('default');
    };
    
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onImageSelected(file);
        }
    }, [onImageSelected]);


    return (
        <div className="text-center py-10" onDragOver={handleDragOver} onDrop={handleDrop}>
            <h2 className="text-4xl font-extrabold text-gray-800">Welcome to the Future of Home Design</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">See your dream home come to life. Upload a photo of your house or start with one of ours to instantly visualize new siding, roofing, and more.</p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Upload Option */}
                <div 
                    className="group p-8 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 cursor-pointer"
                    onClick={handleUploadClick}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <h3 className="mt-6 text-2xl font-bold text-gray-700 group-hover:text-blue-800">Upload a Photo</h3>
                    <p className="mt-2 text-gray-500">Click here or drag & drop an image of your home.</p>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                </div>

                {/* Default Image Option */}
                <div 
                    className="group p-8 border-2 border-transparent rounded-2xl flex flex-col items-center justify-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={handleDefaultClick}
                >
                    <img src={DEFAULT_HOUSE_IMAGE_URL} alt="Default beautiful house" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="relative text-white z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        <h3 className="mt-6 text-2xl font-bold">Use Our House</h3>
                        <p className="mt-2 text-gray-200">Start designing instantly with our sample image.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

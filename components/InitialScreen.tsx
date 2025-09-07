import React, { useCallback, useState } from 'react';
import { DEFAULT_HOUSE_IMAGE_URL } from '../constants';

interface InitialScreenProps {
  onImageSelected: (file: File, url: string) => void;
  onError: (message: string) => void;
}

export const InitialScreen: React.FC<InitialScreenProps> = ({ onImageSelected, onError }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File | null | undefined) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        onError("Image size cannot exceed 10MB.");
        return;
      }
      const url = URL.createObjectURL(file);
      onImageSelected(file, url);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0]);
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  }, []);

  const handleUseDefaultImage = async () => {
    try {
        const response = await fetch(DEFAULT_HOUSE_IMAGE_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        const file = new File([blob], "default-house.jpg", { type: blob.type });
        const url = URL.createObjectURL(file);
        onImageSelected(file, url);
    } catch (error) {
        console.error("Failed to fetch default image:", error);
        onError("Could not load the sample house image. Please check your network connection or upload your own.");
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center">
      <h2 className="text-4xl font-bold text-slate-100 mb-4">Visualize Your Home's Future</h2>
      <p className="text-lg text-slate-300 mb-10 max-w-2xl">
        Upload a photo of your home or start with our sample to see how different materials and colors can transform its look.
      </p>
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        <label
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 bg-slate-800/50 backdrop-blur-sm ${isDragging ? 'border-blue-400 bg-blue-900/50' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800'}`}
        >
          <svg className="w-16 h-16 mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          <span className="text-xl font-semibold text-slate-200">Upload Your Photo</span>
          <span className="text-sm text-slate-400 mt-2">or drag and drop</span>
          <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        </label>

        <button onClick={handleUseDefaultImage} className="relative group p-8 rounded-xl overflow-hidden border-2 border-slate-600 hover:border-blue-400 transition-all duration-300 text-left">
           <img src={DEFAULT_HOUSE_IMAGE_URL} alt="Default sample house" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/50 to-transparent"></div>
           <div className="relative flex flex-col justify-end h-full">
                <span className="text-xl font-semibold text-slate-200">Use Our House</span>
                <span className="text-sm text-slate-400 mt-2">Start designing with a beautiful sample home</span>
           </div>
        </button>
      </div>
    </div>
  );
};

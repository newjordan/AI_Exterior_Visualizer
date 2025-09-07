import React from 'react';

interface ResultDisplayProps {
  originalUrl: string | null;
  generatedUrl: string | null;
}

const ImageCard: React.FC<{ title: string; imageUrl: string | null, isPlaceholder?: boolean }> = ({ title, imageUrl, isPlaceholder = false }) => (
  <div className="flex-1 flex flex-col">
    <h3 className="text-lg font-semibold text-gray-600 text-center mb-2">{title}</h3>
    <div className="aspect-w-4 aspect-h-3 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border">
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="object-contain w-full h-full" />
      ) : (
         <div className="text-gray-400 text-center p-4">
            {isPlaceholder ? "Your AI design will appear here." : "Upload an image to see the original."}
         </div>
      )}
    </div>
  </div>
);


export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalUrl, generatedUrl }) => {
  if (!originalUrl && !generatedUrl) return null;
    
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <ImageCard title="Original" imageUrl={originalUrl} />
      <ImageCard title="AI Visualization" imageUrl={generatedUrl} isPlaceholder={true}/>
    </div>
  );
};
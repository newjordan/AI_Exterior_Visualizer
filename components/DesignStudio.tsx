
// FIX: Create the DesignStudio component, which serves as the main user interface for designing the house exterior.
import React, { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { DesignForm } from './DesignForm';
import { Loader } from './Loader';
import type { DesignOptions, ProductData, GenerationProgress } from '../types';

interface DesignStudioProps {
  imageFile: File | null;
  imageUrl: string;
  onImageChange: (file: File | null, url: string) => void;
  productData: ProductData;
  onGenerate: (options: DesignOptions) => void;
  generationProgress: GenerationProgress;
}

export const DesignStudio: React.FC<DesignStudioProps> = ({
  imageFile,
  imageUrl,
  onImageChange,
  productData,
  onGenerate,
  generationProgress,
}) => {
  // Initialize with the first available options from product data
  const [options, setOptions] = useState<DesignOptions>({
    sidingProduct: productData.siding[0]?.options[0]?.value || '',
    sidingColor: productData.siding[0]?.options[0]?.colors[0] || '',
    roofingProduct: productData.roofing[0]?.options[0]?.value || '',
    roofingColor: productData.roofing[0]?.options[0]?.colors[0] || '',
    trimProduct: productData.trim[0]?.options[0]?.value || '',
    trimColor: productData.trim[0]?.options[0]?.colors[0] || '',
    doorProduct: productData.door[0]?.options[0]?.value || '',
    doorColor: productData.door[0]?.options[0]?.colors[0] || '',
  });

  const handleImageFileChange = (file: File | null) => {
    if (file) {
      const newUrl = URL.createObjectURL(file);
      onImageChange(file, newUrl);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8 sticky top-8">
          <ImageUploader 
            onImageChange={handleImageFileChange} 
            previewUrl={imageUrl}
          />
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
             <h2 className="text-2xl font-bold text-gray-700 mb-4">3. Generate Your Design</h2>
             <p className="text-gray-600 mb-6">
                Once you're happy with your product and color selections, let our AI create your new home exterior.
             </p>
             <div className="space-y-4">
                <button
                    onClick={() => onGenerate(options)}
                    disabled={generationProgress.active || !imageFile}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center shadow-lg hover:shadow-blue-500/50"
                >
                    {generationProgress.active ? (
                        <>
                            <Loader size="sm" />
                            <span className="ml-3">Visualizing...</span>
                        </>
                    ) : (
                        'Visualize My Home'
                    )}
                </button>
                {generationProgress.active && (
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">{generationProgress.message}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${generationProgress.percentage}%`, transition: 'width 0.3s ease-in-out' }}></div>
                        </div>
                    </div>
                )}
             </div>
             {!imageFile && <p className="text-xs text-red-600 mt-2 text-center">Please upload an image to begin.</p>}
          </div>
        </div>
        <div className="lg:col-span-2">
          <DesignForm options={options} setOptions={setOptions} productData={productData} />
        </div>
      </div>
    </div>
  );
};
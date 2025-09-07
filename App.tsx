import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { InitialScreen } from './components/InitialScreen';
import { AiScan } from './components/AiScan';
import { DesignStudio } from './components/DesignStudio';
import { ResultModal } from './components/ResultModal';
import { Loader } from './components/Loader';
import type { DesignOptions, ProductCategory, ProductOption, ProductImageUrls } from './types';
import { SIDING_OPTIONS, TRIM_OPTIONS, DOOR_OPTIONS, ROOFING_OPTIONS, DEFAULT_HOUSE_IMAGE_URL } from './constants';
import { visualizeExteriorDesign } from './services/geminiService';

type AppState = 'initial' | 'scanning' | 'designing' | 'error';

const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
        resolve({ base64, mimeType });
    }
    reader.onerror = error => reject(error);
  });
};

const findProductByValue = (categories: ProductCategory[], value: string): ProductOption | undefined => {
    for (const category of categories) {
        const product = category.options.find(p => p.value === value);
        if (product) return product;
    }
    return undefined;
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('initial');
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [designOptions, setDesignOptions] = useState<DesignOptions>({
    sidingProduct: 'Gray Cedar Shake Siding',
    sidingColor: 'Light Gray',
    trimProduct: 'Classic White Trim',
    trimColor: 'White',
    doorProduct: 'Craftsman Style Blue Door',
    doorColor: 'Navy Blue',
    roofingProduct: 'Onyx Black Asphalt Shingles',
    roofingColor: 'Onyx Black',
  });

  const handleImageSelected = async (source: File | 'default') => {
    setGeneratedImageUrl(null);
    setError(null);

    try {
        let file: File;
        if (source === 'default') {
            const response = await fetch(DEFAULT_HOUSE_IMAGE_URL);
            const blob = await response.blob();
            file = new File([blob], "default-house.jpg", { type: blob.type });
        } else {
            file = source;
        }
        setOriginalImage(file);
        setOriginalImageUrl(URL.createObjectURL(file));
        setAppState('scanning');
    } catch (e) {
        console.error("Failed to load image:", e);
        setError("Could not load the selected image. Please try again.");
        setAppState('error');
    }
  };

  const handleScanComplete = () => {
    setAppState('designing');
  };
  
  const handleVisualize = useCallback(async () => {
    if (!originalImage) {
        setError("Something went wrong, the original image is missing.");
        setAppState('error');
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
        const sidingProduct = findProductByValue(SIDING_OPTIONS, designOptions.sidingProduct);
        const trimProduct = findProductByValue(TRIM_OPTIONS, designOptions.trimProduct);
        const doorProduct = findProductByValue(DOOR_OPTIONS, designOptions.doorProduct);
        const roofingProduct = findProductByValue(ROOFING_OPTIONS, designOptions.roofingProduct);

        if (!sidingProduct || !trimProduct || !doorProduct || !roofingProduct) {
            setError("Could not find the details for a selected product. Please refresh and try again.");
            setAppState('error');
            setIsLoading(false);
            return;
        }

        const productImageUrls: ProductImageUrls = {
            sidingImageUrl: sidingProduct.imageUrl,
            trimImageUrl: trimProduct.imageUrl,
            doorImageUrl: doorProduct.imageUrl,
            roofingImageUrl: roofingProduct.imageUrl,
        };

        const { base64, mimeType } = await fileToBase64(originalImage);
        const newImageBase64 = await visualizeExteriorDesign(base64, mimeType, designOptions, productImageUrls);
        setGeneratedImageUrl(`data:image/png;base64,${newImageBase64}`);
        setIsModalOpen(true); // Open the modal for the grand reveal
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.';
        setError(`Visualization failed: ${errorMessage}`);
        setAppState('error');
    } finally {
        setIsLoading(false);
    }
  }, [originalImage, designOptions]);

  const handleStartOver = () => {
      setAppState('initial');
      setOriginalImage(null);
      setOriginalImageUrl(null);
      setGeneratedImageUrl(null);
      setError(null);
      setIsLoading(false);
      setIsModalOpen(false);
  }

  const renderContent = () => {
    switch (appState) {
      case 'initial':
        return <InitialScreen onImageSelected={handleImageSelected} />;
      case 'scanning':
        return <AiScan imageUrl={originalImageUrl!} onScanComplete={handleScanComplete} />;
      case 'designing':
        return (
            <DesignStudio 
                imageUrl={originalImageUrl!}
                options={designOptions}
                setOptions={setDesignOptions}
                onVisualize={handleVisualize}
                isLoading={isLoading}
                generatedImageUrl={generatedImageUrl}
                onStartOver={handleStartOver}
            />
        );
      case 'error':
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-red-50 text-red-700 p-4 rounded-lg text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="mt-4 text-lg font-semibold">An Error Occurred</p>
                <p className="mt-2">{error}</p>
                <button onClick={handleStartOver} className="mt-6 bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300">
                    Start Over
                </button>
            </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      <Header />
      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
      <ResultModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={generatedImageUrl}
      />
      <Footer />
    </div>
  );
}
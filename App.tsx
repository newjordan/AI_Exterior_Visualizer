import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { InitialScreen } from './components/InitialScreen';
import { DesignStudio } from './components/DesignStudio';
import { MaskingScreen } from './components/MaskingScreen';
import { ResultDisplay } from './components/ResultDisplay';
import { Loader } from './components/Loader';
import { generateMasks, applyChangesIteratively } from './services/geminiService';
import type { DesignOptions, ProductData, HouseMasks, MaskingProgress, GenerationProgress } from './types';

type AppScreen = 'initial' | 'design' | 'masking' | 'result';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('initial');
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const [masks, setMasks] = useState<HouseMasks>({});
  const [maskingProgress, setMaskingProgress] = useState<MaskingProgress | null>(null);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({ active: false, message: '', percentage: 0 });
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/products.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ProductData = await response.json();
        setProductData(data);
      } catch (e) {
        console.error("Failed to fetch product data:", e);
        setError("Could not load the product catalog. Please try refreshing the page.");
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleImageSelected = async (file: File, url: string) => {
    setImageFile(file);
    setImageUrl(url);
    setError(null);
    setMasks({}); // Reset previous masks
    
    const initialProgress: MaskingProgress = {
      siding: 'pending',
      roofing: 'pending',
      trim: 'pending',
      door: 'pending',
    };
    setMaskingProgress(initialProgress);
    setScreen('masking');

    const progressCallback = (element: keyof HouseMasks, status: 'generating' | 'complete' | 'error', data?: string) => {
      setMaskingProgress(prev => ({ ...prev!, [element]: status }));
      if (status === 'complete' && data) {
        setMasks(prev => ({ ...prev, [element]: data }));
      }
    };

    try {
      const generatedMasks = await generateMasks(file, progressCallback);
      setMasks(generatedMasks);
      setScreen('design');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during AI analysis.');
      handleReset(); // Go back to start on total failure
    }
  };


  const handleGenerate = async (options: DesignOptions) => {
    if (!imageFile) {
      setError('Cannot generate design without an image.');
      return;
    }
    setGenerationProgress({ active: true, message: 'Starting visualization...', percentage: 0 });
    setError(null);
    
    const progressCallback = (message: string, percentage: number) => {
        setGenerationProgress({ active: true, message, percentage });
    };

    try {
      const generatedImageBase64 = await applyChangesIteratively(imageFile, masks, options, progressCallback);
      setGeneratedImageUrl(`data:image/png;base64,${generatedImageBase64}`);
      setScreen('result');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
      setScreen('design');
    } finally {
      setGenerationProgress({ active: false, message: '', percentage: 0 });
    }
  };

  const handleReset = () => {
    setScreen('initial');
    setImageFile(null);
    setImageUrl('');
    setMasks({});
    setGeneratedImageUrl('');
    setMaskingProgress(null);
    setGenerationProgress({ active: false, message: '', percentage: 0 });
    setError(null);
  };
  
  const handleImageChangeOnDesignScreen = (file: File | null, url: string) => {
     if (file && url) {
        handleImageSelected(file, url);
     }
  }

  const renderScreen = () => {
    if (!productData && !error) {
      return (
        <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
                <Loader size="lg" />
                <p className="mt-4 text-slate-300">Loading Design Options...</p>
            </div>
        </div>
      );
    }

    switch (screen) {
      case 'initial':
        return <InitialScreen onImageSelected={handleImageSelected} onError={setError} />;
      case 'masking':
        return <MaskingScreen progress={maskingProgress} masks={masks} />;
      case 'design':
        return (
          <DesignStudio
            imageFile={imageFile}
            imageUrl={imageUrl}
            onImageChange={handleImageChangeOnDesignScreen}
            productData={productData!} // We know it's loaded here
            onGenerate={handleGenerate}
            generationProgress={generationProgress}
          />
        );
      case 'result':
        return (
          <div className="container mx-auto px-4 py-8">
            <ResultDisplay originalImageUrl={imageUrl} generatedImageUrl={generatedImageUrl} />
          </div>
        );
      default:
        return <InitialScreen onImageSelected={handleImageSelected} onError={setError} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans bg-[radial-gradient(circle_at_1px_1px,#334155_1px,transparent_0)] [background-size:24px_24px]">
      <Header onReset={handleReset} showReset={screen !== 'initial'} />
      <main className="flex-grow flex flex-col">
        {error && (
           <div className="container mx-auto px-4 mt-4">
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">An error occurred: </strong>
              <span className="mt-1 block sm:inline">{error}</span>
            </div>
          </div>
        )}
        {renderScreen()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
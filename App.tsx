import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { InitialScreen } from './components/InitialScreen';
import { DesignStudio } from './components/DesignStudio';
import { MaskingScreen } from './components/MaskingScreen';
import { ResultDisplay } from './components/ResultDisplay';
import { Loader } from './components/Loader';
import { DevPanel } from './components/DevPanel';
import { generateMasks, applyChangesIteratively, generateSingleMask } from './services/geminiService';
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
  
  const [customMaterials, setCustomMaterials] = useState<Partial<Record<keyof ProductData, File>>>({});
  
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

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
    setMasks({});
    
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
      handleReset();
    }
  };

  const findProductImageUrl = (productName: string): string | undefined => {
      if (!productData) return undefined;
      for (const categoryKey of Object.keys(productData)) {
          const key = categoryKey as keyof ProductData;
          for (const category of productData[key]) {
              const product = category.options.find(p => p.value === productName);
              if (product) {
                  return product.imageUrls[0];
              }
          }
      }
      return undefined;
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

    const selectedImageFiles: Partial<Record<keyof ProductData, File | string>> = {
      siding: options.sidingProduct === 'custom-siding' ? customMaterials.siding : findProductImageUrl(options.sidingProduct),
      roofing: options.roofingProduct === 'custom-roofing' ? customMaterials.roofing : findProductImageUrl(options.roofingProduct),
      trim: options.trimProduct === 'custom-trim' ? customMaterials.trim : findProductImageUrl(options.trimProduct),
      door: options.doorProduct === 'custom-door' ? customMaterials.door : findProductImageUrl(options.doorProduct),
    };

    try {
      const generatedImageBase64 = await applyChangesIteratively(imageFile, masks, options, selectedImageFiles, progressCallback);
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
    setCustomMaterials({});
    setIsDevPanelOpen(false);
  };
  
  const handleCustomMaterialAdded = (category: keyof ProductData, file: File) => {
    setCustomMaterials(prev => ({ ...prev, [category]: file }));
  };

  const handleRegenerateMask = async (element: keyof HouseMasks) => {
    if (!imageFile) {
        setError("Cannot regenerate mask without the original image.");
        return;
    }
    setMaskingProgress(prev => ({ ...prev!, [element]: 'generating' }));
    try {
        const newMaskData = await generateSingleMask(imageFile, element);
        setMasks(prev => ({ ...prev, [element]: newMaskData }));
        setMaskingProgress(prev => ({ ...prev!, [element]: 'complete' }));
    } catch (err) {
        console.error(`Failed to re-generate mask for ${element}:`, err);
        setError(`Failed to re-generate the ${element} mask.`);
        setMaskingProgress(prev => ({ ...prev!, [element]: 'error' }));
    }
  };

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
            imageUrl={imageUrl}
            productData={productData!}
            onGenerate={handleGenerate}
            generationProgress={generationProgress}
            customMaterials={customMaterials}
            onCustomMaterialAdded={handleCustomMaterialAdded}
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Blueprint background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              <path d="M 20 0 L 20 40 M 0 20 L 40 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
            </pattern>
            <pattern id="blueprint-dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.3"/>
              <circle cx="40" cy="40" r="1" fill="currentColor" opacity="0.3"/>
              <circle cx="0" cy="0" r="1" fill="currentColor" opacity="0.3"/>
              <circle cx="40" cy="0" r="1" fill="currentColor" opacity="0.3"/>
              <circle cx="0" cy="40" r="1" fill="currentColor" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blueprint-grid)" className="text-blue-400"/>
          <rect width="100%" height="100%" fill="url(#blueprint-dots)" className="text-blue-400"/>
        </svg>
      </div>
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-900/20 pointer-events-none"/>
      
      <Header onReset={handleReset} showReset={screen !== 'initial'} />
      <main className="flex-grow flex flex-col relative z-10">
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
      {screen === 'design' && Object.keys(masks).length > 0 && (
          <button
              onClick={() => setIsDevPanelOpen(true)}
              className="fixed bottom-4 right-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
          >
              Dev
          </button>
      )}
      {isDevPanelOpen && (
          <DevPanel
              originalImage={imageUrl}
              masks={masks}
              onClose={() => setIsDevPanelOpen(false)}
              onRegenerate={handleRegenerateMask}
              progress={maskingProgress}
          />
      )}
    </div>
  );
};

export default App;

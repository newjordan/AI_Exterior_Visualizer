import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { InitialScreen } from './components/InitialScreen';
import { AiScan } from './components/AiScan';
import { DesignStudio } from './components/DesignStudio';
import { ResultModal } from './components/ResultModal';
import { Loader } from './components/Loader';
import type { ProductData } from './types';

type AppState = 'loading' | 'initial' | 'scanning' | 'designing' | 'result';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<{ file: File; url: string } | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/products.json');
        if (!response.ok) {
          throw new Error('Failed to load product catalog');
        }
        const data: ProductData = await response.json();
        setProductData(data);
        setAppState('initial');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setAppState('initial'); // Or an error state
      }
    };

    fetchProducts();
  }, []);
  
  const handleImageSelected = (file: File, url: string) => {
    setOriginalImage({ file, url });
    setAppState('scanning');
  };

  const handleScanComplete = () => {
    setAppState('designing');
  };
  
  const handleGenerationComplete = (url: string) => {
    setGeneratedImageUrl(url);
    setAppState('result');
  };

  const handleCloseResult = () => {
    setAppState('designing');
  };

  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImageUrl(null);
    setError(null);
    setAppState('initial');
  };

  const renderContent = () => {
    if (appState === 'loading' || !productData) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader size="lg" />
                <p className="text-slate-300">Loading design library...</p>
            </div>
        );
    }
    
    if (error && !productData) {
         return (
             <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                 <h2 className="text-2xl font-bold text-red-400">Failed to Load Products</h2>
                 <p className="text-slate-300">{error}</p>
                 <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                     Retry
                 </button>
             </div>
         );
    }

    switch (appState) {
      case 'initial':
        return <InitialScreen onImageSelected={handleImageSelected} onError={setError} />;
      case 'scanning':
        return originalImage ? <AiScan imageUrl={originalImage.url} onScanComplete={handleScanComplete} /> : null;
      case 'designing':
      case 'result':
        return originalImage ? (
            <DesignStudio
                originalImage={originalImage}
                onGenerationComplete={handleGenerationComplete}
                generatedImageUrl={generatedImageUrl}
                productData={productData}
                onReset={handleReset}
            />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans">
      <Header onReset={handleReset} showReset={appState === 'designing' || appState === 'result'} />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
        {renderContent()}
      </main>
      <Footer />
      {appState === 'result' && generatedImageUrl && (
          <ResultModal
              imageUrl={generatedImageUrl}
              onClose={handleCloseResult}
          />
      )}
    </div>
  );
};

export default App;

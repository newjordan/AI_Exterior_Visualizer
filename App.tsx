import { useMemo, useRef, useState } from 'react';
import catalog from './products.json';
import { DesignStudio } from './components/DesignStudio';
import { DevPanel } from './components/DevPanel';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { InitialScreen } from './components/InitialScreen';
import { MaskingScreen } from './components/MaskingScreen';
import { ResultDisplay } from './components/ResultDisplay';
import { clearSessionApiKey, getApiKey, getSessionApiKey, hasConfiguredEnvKey, setSessionApiKey } from './services/apiKey';
import { isAbortError, toUserMessage } from './services/errors';
import type { DesignOptions, GenerationProgress, HouseMasks, MaskingProgress, ProductData } from './types';

type AppScreen = 'initial' | 'design' | 'masking' | 'result';
type Banner = { tone: 'error' | 'warning'; message: string } | null;

const maskElements: (keyof HouseMasks)[] = ['siding', 'roofing', 'trim', 'door'];

const isProductData = (value: unknown): value is ProductData => {
  if (!value || typeof value !== 'object') return false;
  const data = value as ProductData;
  return [data.siding, data.roofing, data.trim, data.door].every(Array.isArray);
};

const productData = isProductData(catalog) ? catalog : null;

const emptyProgress = (): MaskingProgress => ({
  siding: 'pending',
  roofing: 'pending',
  trim: 'pending',
  door: 'pending',
});

const App = () => {
  const [screen, setScreen] = useState<AppScreen>('initial');
  const [banner, setBanner] = useState<Banner>(productData ? null : { tone: 'error', message: 'The material catalog could not be read.' });
  const [keyRevision, setKeyRevision] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [masks, setMasks] = useState<HouseMasks>({});
  const [maskingProgress, setMaskingProgress] = useState<MaskingProgress | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({ active: false, message: '', percentage: 0 });
  const [customMaterials, setCustomMaterials] = useState<Partial<Record<keyof ProductData, File>>>({});
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const apiKey = useMemo(() => getApiKey(), [keyRevision]);
  const usingSessionKey = useMemo(() => Boolean(getSessionApiKey()), [keyRevision]);
  const usingEnvKey = hasConfiguredEnvKey() && !usingSessionKey;
  const hasApiKey = Boolean(apiKey);
  const hasMasks = maskElements.some((element) => Boolean(masks[element]));

  const cancelWork = () => {
    requestId.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const beginRequest = () => {
    cancelWork();
    setGenerationProgress({ active: false, message: '', percentage: 0 });
    const id = requestId.current;
    const controller = new AbortController();
    abortRef.current = controller;
    return { id, signal: controller.signal };
  };

  const stillCurrent = (id: number) => id === requestId.current;

  const rememberImage = (file: File, url: string) => {
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    setImageFile(file);
    setImageUrl(url);
    setMasks({});
    setGeneratedImageUrl('');
    setMaskingProgress(null);
    setBanner(null);
  };

  const runAnalysis = async (file: File) => {
    const { id, signal } = beginRequest();
    setMaskingProgress(emptyProgress());
    setScreen('masking');
    setBanner(null);

    const progressCallback = (element: keyof HouseMasks, status: 'generating' | 'complete' | 'error', data?: string) => {
      if (!stillCurrent(id)) return;
      setMaskingProgress((current) => ({ ...(current ?? emptyProgress()), [element]: status }));
      if (status === 'complete' && data) {
        setMasks((current) => ({ ...current, [element]: data }));
      }
    };

    try {
      const { generateMasks } = await import('./services/geminiService');
      const generated = await generateMasks(file, progressCallback, signal);
      if (!stillCurrent(id)) return;
      setMasks(generated);
      const missing = maskElements.filter((element) => !generated[element]);
      if (missing.length > 0) {
        setBanner({
          tone: 'warning',
          message: `Analysis finished without a mask for ${missing.join(', ')}. Those areas will stay as they are.`,
        });
      }
      setScreen('design');
    } catch (error) {
      if (!stillCurrent(id) || isAbortError(error)) return;
      console.error(error);
      setBanner({ tone: 'error', message: toUserMessage(error) });
      setScreen('design');
    }
  };

  const handleImageSelected = (file: File, url: string) => {
    cancelWork();
    rememberImage(file, url);
    if (!getApiKey()) {
      setScreen('design');
      return;
    }
    void runAnalysis(file);
  };

  const findProductImageUrl = (productName: string): string | undefined => {
    if (!productData) return undefined;
    for (const categoryKey of Object.keys(productData) as (keyof ProductData)[]) {
      for (const category of productData[categoryKey]) {
        const product = category.options.find((option) => option.value === productName);
        if (product?.imageUrls[0]) return product.imageUrls[0];
      }
    }
    return undefined;
  };

  const handleGenerate = async (options: DesignOptions) => {
    if (!imageFile) {
      setBanner({ tone: 'error', message: 'Choose a photo before generating a design.' });
      return;
    }
    const { id, signal } = beginRequest();
    setGenerationProgress({ active: true, message: 'Starting visualization…', percentage: 0 });
    setBanner(null);

    const selectedImageFiles: Partial<Record<keyof ProductData, File | string>> = {
      siding: options.sidingProduct === 'custom-siding' ? customMaterials.siding : findProductImageUrl(options.sidingProduct),
      roofing: options.roofingProduct === 'custom-roofing' ? customMaterials.roofing : findProductImageUrl(options.roofingProduct),
      trim: options.trimProduct === 'custom-trim' ? customMaterials.trim : findProductImageUrl(options.trimProduct),
      door: options.doorProduct === 'custom-door' ? customMaterials.door : findProductImageUrl(options.doorProduct),
    };

    try {
      const { applyChangesIteratively } = await import('./services/geminiService');
      const generatedImageBase64 = await applyChangesIteratively(
        imageFile,
        masks,
        options,
        selectedImageFiles,
        (message, percentage) => {
          if (stillCurrent(id)) setGenerationProgress({ active: true, message, percentage });
        },
        signal,
      );
      if (!stillCurrent(id)) return;
      if (!generatedImageBase64) {
        throw new Error('The visualization finished without an image.');
      }
      setGeneratedImageUrl(`data:image/png;base64,${generatedImageBase64}`);
      setScreen('result');
    } catch (error) {
      if (!stillCurrent(id) || isAbortError(error)) return;
      console.error(error);
      setBanner({ tone: 'error', message: toUserMessage(error) });
      setScreen('design');
    } finally {
      if (stillCurrent(id)) {
        setGenerationProgress({ active: false, message: '', percentage: 0 });
      }
    }
  };

  const handleReset = () => {
    cancelWork();
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    setScreen('initial');
    setImageFile(null);
    setImageUrl('');
    setMasks({});
    setGeneratedImageUrl('');
    setMaskingProgress(null);
    setGenerationProgress({ active: false, message: '', percentage: 0 });
    setBanner(productData ? null : { tone: 'error', message: 'The material catalog could not be read.' });
    setCustomMaterials({});
    setIsInspectorOpen(false);
  };

  const handleRegenerateMask = async (element: keyof HouseMasks) => {
    if (!imageFile) {
      setBanner({ tone: 'error', message: 'Choose a photo before regenerating a mask.' });
      return;
    }
    const { id, signal } = beginRequest();
    setMaskingProgress((current) => ({ ...(current ?? emptyProgress()), [element]: 'generating' }));
    try {
      const { generateSingleMask } = await import('./services/geminiService');
      const newMaskData = await generateSingleMask(imageFile, element, signal);
      if (!stillCurrent(id)) return;
      setMasks((current) => ({ ...current, [element]: newMaskData }));
      setMaskingProgress((current) => ({ ...(current ?? emptyProgress()), [element]: 'complete' }));
    } catch (error) {
      if (!stillCurrent(id) || isAbortError(error)) return;
      console.error(error);
      setBanner({ tone: 'error', message: toUserMessage(error) });
      setMaskingProgress((current) => ({ ...(current ?? emptyProgress()), [element]: 'error' }));
    }
  };

  const renderScreen = () => {
    if (!productData) return null;
    if (screen === 'masking') {
      return <MaskingScreen progress={maskingProgress} masks={masks} />;
    }
    if (screen === 'design') {
      return (
        <DesignStudio
          imageUrl={imageUrl}
          productData={productData}
          hasApiKey={hasApiKey}
          usingSessionKey={usingSessionKey}
          usingEnvKey={usingEnvKey}
          hasMasks={hasMasks}
          onApiKeySave={(key) => {
            setSessionApiKey(key);
            setKeyRevision((value) => value + 1);
          }}
          onApiKeyClear={() => {
            clearSessionApiKey();
            setKeyRevision((value) => value + 1);
          }}
          onAnalyze={() => {
            if (imageFile) void runAnalysis(imageFile);
          }}
          onGenerate={handleGenerate}
          generationProgress={generationProgress}
          customMaterials={customMaterials}
          onCustomMaterialAdded={(category, file) => {
            setCustomMaterials((current) => ({ ...current, [category]: file }));
          }}
          />
      );
    }
    if (screen === 'result') {
      return <ResultDisplay originalImageUrl={imageUrl} generatedImageUrl={generatedImageUrl} />;
    }
    return (
      <InitialScreen
        hasApiKey={hasApiKey}
        usingSessionKey={usingSessionKey}
        usingEnvKey={usingEnvKey}
        onApiKeySave={(key) => {
          setSessionApiKey(key);
          setKeyRevision((value) => value + 1);
        }}
        onApiKeyClear={() => {
          clearSessionApiKey();
          setKeyRevision((value) => value + 1);
        }}
        onImageSelected={handleImageSelected}
        onError={(message) => setBanner({ tone: 'error', message })}
      />
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col font-sans text-slate-100">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header onReset={handleReset} showReset={screen !== 'initial'} aiReady={hasApiKey} />
      <main id="main" className="flex flex-1 flex-col" tabIndex={-1}>
        {banner && (
          <div className="mx-auto mt-4 w-full max-w-6xl px-4">
            <div
              role={banner.tone === 'error' ? 'alert' : 'status'}
              className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 ${
                banner.tone === 'error'
                  ? 'border-red-700 bg-red-950/80 text-red-100'
                  : 'border-amber-700 bg-amber-950/80 text-amber-100'
              }`}
            >
              <p>{banner.message}</p>
              <button type="button" onClick={() => setBanner(null)} className="shrink-0 text-sm font-semibold underline">
                Dismiss
              </button>
            </div>
          </div>
        )}
        {renderScreen()}
      </main>
      <Footer />
      {screen === 'design' && hasApiKey && (
        <button
          type="button"
          onClick={() => setIsInspectorOpen(true)}
          className="fixed right-4 bottom-4 z-40 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-slate-600 hover:bg-slate-700"
        >
          Inspect masks
        </button>
      )}
      {isInspectorOpen && (
        <DevPanel
          originalImage={imageUrl}
          masks={masks}
          onClose={() => setIsInspectorOpen(false)}
          onRegenerate={handleRegenerateMask}
          progress={maskingProgress}
        />
      )}
    </div>
  );
};

export default App;

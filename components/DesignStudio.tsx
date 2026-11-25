import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { DesignOptions, GenerationProgress, ProductCategory, ProductData, ProductOption } from '../types';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '../constants';
import { CameraIcon } from './icons/CameraIcon';
import { DoorIcon } from './icons/DoorIcon';
import { RoofingIcon } from './icons/RoofingIcon';
import { SidingIcon } from './icons/SidingIcon';
import { TrimIcon } from './icons/TrimIcon';
import { Loader } from './Loader';
import { ApiKeyPanel } from './ApiKeyPanel';

interface DesignStudioProps {
  imageUrl: string;
  productData: ProductData;
  hasApiKey: boolean;
  usingSessionKey: boolean;
  usingEnvKey: boolean;
  hasMasks: boolean;
  onApiKeySave: (key: string) => void;
  onApiKeyClear: () => void;
  onAnalyze: () => void;
  onGenerate: (options: DesignOptions) => void;
  generationProgress: GenerationProgress;
  customMaterials: Partial<Record<keyof ProductData, File>>;
  onCustomMaterialAdded: (category: keyof ProductData, file: File) => void;
}

const categories = ['siding', 'roofing', 'trim', 'door'] as const;

const labels: Record<(typeof categories)[number], string> = {
  siding: 'Siding',
  roofing: 'Roofing',
  trim: 'Trim',
  door: 'Door',
};

const findColorsForProduct = (groups: ProductCategory[], productName: string): string[] => {
  for (const group of groups) {
    const product = group.options.find((option) => option.value === productName);
    if (product) return product.colors;
  }
  return [];
};

const CategoryIcon = ({ category, className }: { category: keyof ProductData; className?: string }) => {
  if (category === 'siding') return <SidingIcon className={className} />;
  if (category === 'roofing') return <RoofingIcon className={className} />;
  if (category === 'trim') return <TrimIcon className={className} />;
  return <DoorIcon className={className} />;
};

const ProductSwatch = ({ product, selected, onSelect }: { product: ProductOption; selected: boolean; onSelect: () => void }) => {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`overflow-hidden rounded-xl border-2 text-left ${
        selected ? 'border-blue-400' : 'border-slate-600 hover:border-slate-400'
      }`}
    >
      <span className="block h-24 bg-slate-800">
        {broken ? (
          <span className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-slate-200">
            Texture unavailable
          </span>
        ) : (
          <img
            src={product.imageUrls[0]}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        )}
      </span>
      <span className={`block truncate px-3 py-2 text-sm font-semibold ${selected ? 'bg-blue-950 text-blue-100' : 'bg-slate-800 text-slate-100'}`}>
        {product.label}
      </span>
    </button>
  );
};

export const DesignStudio = ({
  imageUrl,
  productData,
  hasApiKey,
  usingSessionKey,
  usingEnvKey,
  hasMasks,
  onApiKeySave,
  onApiKeyClear,
  onAnalyze,
  onGenerate,
  generationProgress,
  customMaterials,
  onCustomMaterialAdded,
}: DesignStudioProps) => {
  const customInputRef = useRef<HTMLInputElement>(null);
  const progressId = useId();
  const [activeCategory, setActiveCategory] = useState<keyof ProductData>('siding');
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [customPreviewUrls, setCustomPreviewUrls] = useState<Partial<Record<keyof ProductData, string>>>({});
  const [options, setOptions] = useState<DesignOptions>({
    sidingProduct: productData.siding[0]?.options[0]?.value ?? '',
    sidingColor: productData.siding[0]?.options[0]?.colors[0] ?? '',
    roofingProduct: productData.roofing[0]?.options[0]?.value ?? '',
    roofingColor: productData.roofing[0]?.options[0]?.colors[0] ?? '',
    trimProduct: productData.trim[0]?.options[0]?.value ?? '',
    trimColor: productData.trim[0]?.options[0]?.colors[0] ?? '',
    doorProduct: productData.door[0]?.options[0]?.value ?? '',
    doorColor: productData.door[0]?.options[0]?.colors[0] ?? '',
  });

  useEffect(() => {
    const created: string[] = [];
    const next: Partial<Record<keyof ProductData, string>> = {};
    categories.forEach((category) => {
      const file = customMaterials[category];
      if (!file) return;
      const url = URL.createObjectURL(file);
      next[category] = url;
      created.push(url);
    });
    setCustomPreviewUrls(next);
    return () => {
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [customMaterials]);

  const augmentedData = useMemo(() => {
    const next = structuredClone(productData);
    categories.forEach((category) => {
      const previewUrl = customPreviewUrls[category];
      if (!previewUrl) return;
      const customOption: ProductOption = {
        value: `custom-${category}`,
        label: `My ${category}`,
        imageUrls: [previewUrl],
        colors: ['Custom'],
      };
      if (!next[category][0]) {
        next[category][0] = { label: 'Custom', options: [] };
      }
      next[category][0].options = [
        customOption,
        ...next[category][0].options.filter((option) => !option.value.startsWith('custom-')),
      ];
    });
    return next;
  }, [productData, customPreviewUrls]);

  const selectProduct = (category: keyof ProductData, value: string) => {
    const colors = findColorsForProduct(augmentedData[category], value);
    setOptions((current) => ({
      ...current,
      [`${category}Product`]: value,
      [`${category}Color`]: colors[0] ?? 'Custom',
    }));
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = categories.length - 1;
    const nextIndex =
      event.key === 'ArrowRight' ? (index + 1) % categories.length
      : event.key === 'ArrowLeft' ? (index + last) % categories.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = categories[nextIndex];
    setActiveCategory(next);
    document.getElementById(`material-tab-${next}`)?.focus();
  };

  const groups = augmentedData[activeCategory];
  const selectedProduct = options[`${activeCategory}Product`];
  const selectedColor = options[`${activeCategory}Color`];
  const availableColors = findColorsForProduct(groups, selectedProduct);

  const captureCustom = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]) && !file.type.startsWith('image/')) {
      setMaterialError('Use an image file for the custom material.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMaterialError('Custom material images must be 10 MB or smaller.');
      return;
    }
    setMaterialError(null);
    onCustomMaterialAdded(activeCategory, file);
    selectProduct(activeCategory, `custom-${activeCategory}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h2 className="text-2xl font-semibold text-slate-50">Choose materials</h2>
      <p className="mt-2 max-w-3xl text-slate-300">
        {hasMasks
          ? 'The photo has been mapped. Adjust the materials, then visualize the house.'
          : 'You are in preview. Pick materials now, then analyze the photo when a Gemini key is available.'}
      </p>

      {!hasApiKey && (
        <div className="mt-6">
          <ApiKeyPanel
            hasApiKey={hasApiKey}
            usingSessionKey={usingSessionKey}
            usingEnvKey={usingEnvKey}
            onSave={onApiKeySave}
            onClear={onApiKeyClear}
          />
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <img
          src={imageUrl}
          alt="House to redesign"
          className="max-h-[32rem] w-auto max-w-full rounded-2xl border border-slate-700 shadow-2xl"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70">
        <div role="tablist" aria-label="Exterior materials" className="grid grid-cols-4 border-b border-slate-700">
          {categories.map((category, index) => {
            const selected = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                id={`material-tab-${category}`}
                aria-selected={selected}
                aria-controls={`material-panel-${category}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveCategory(category)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`flex flex-col items-center gap-2 px-2 py-4 text-sm font-semibold ${
                  selected ? 'bg-slate-800 text-blue-200' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <CategoryIcon category={category} className="h-6 w-6" />
                {labels[category]}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`material-panel-${activeCategory}`} aria-labelledby={`material-tab-${activeCategory}`} className="p-4 sm:p-6">
          {groups.map((group) => (
            <div key={group.label} className="mb-6 last:mb-0">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">{group.label}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.options.map((product) => (
                  <ProductSwatch
                    key={product.value}
                    product={product}
                    selected={selectedProduct === product.value}
                    onSelect={() => selectProduct(activeCategory, product.value)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => customInputRef.current?.click()}
                  className="flex min-h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-500 px-3 py-4 text-center hover:border-slate-300 hover:bg-slate-800/60"
                >
                  <CameraIcon className="mb-2 h-8 w-8 text-slate-300" />
                  <span className="text-sm font-semibold text-slate-100">Use your own</span>
                </button>
              </div>
            </div>
          ))}

          <input
            ref={customInputRef}
            type="file"
            accept="image/*"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={(event) => {
              captureCustom(event.target.files?.[0]);
              event.target.value = '';
            }}
          />

          {materialError && (
            <p className="mt-4 text-sm text-red-300" role="alert">
              {materialError}
            </p>
          )}

          {availableColors.length > 1 && (
            <fieldset className="mt-6 border-t border-slate-700 pt-6">
              <legend className="mb-3 text-sm font-semibold text-slate-200">Color</legend>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const selected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setOptions((current) => ({ ...current, [`${activeCategory}Color`]: color }))}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                        selected
                          ? 'border-blue-400 bg-blue-600 text-white'
                          : 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-5 sm:p-6" aria-labelledby="visualize-heading">
        <h2 id="visualize-heading" className="text-2xl font-semibold text-slate-50">
          {hasMasks ? 'Visualize the house' : 'Analyze the house'}
        </h2>
        <p className="mt-2 text-slate-300">
          {hasApiKey
            ? hasMasks
              ? 'Rendering runs one surface at a time so the request stays within API limits.'
              : 'Analysis builds a mask for siding, roofing, trim, and the door before any materials are applied.'
            : 'Save a Gemini API key above to leave preview mode.'}
        </p>
        <button
          type="button"
          onClick={() => (hasMasks ? onGenerate(options) : onAnalyze())}
          disabled={!hasApiKey || generationProgress.active}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
        >
          {generationProgress.active ? (
            <>
              <Loader size="sm" />
              <span className="ml-3">Visualizing</span>
            </>
          ) : hasMasks ? (
            'Visualize my home'
          ) : (
            'Analyze this home'
          )}
        </button>
        {generationProgress.active && (
          <div className="mt-4">
            <p id={progressId} className="mb-2 text-sm text-slate-200" role="status">
              {generationProgress.message}
            </p>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-slate-700"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(generationProgress.percentage)}
              aria-labelledby={progressId}
            >
              <div className="h-full bg-blue-400" style={{ width: `${generationProgress.percentage}%` }} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

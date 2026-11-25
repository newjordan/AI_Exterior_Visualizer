import { useCallback, useState } from 'react';
import { ACCEPTED_IMAGE_TYPES, DEFAULT_HOUSE_IMAGE_URL, MAX_IMAGE_BYTES } from '../constants';
import { ApiKeyPanel } from './ApiKeyPanel';

interface InitialScreenProps {
  hasApiKey: boolean;
  usingSessionKey: boolean;
  usingEnvKey: boolean;
  onApiKeySave: (key: string) => void;
  onApiKeyClear: () => void;
  onImageSelected: (file: File, url: string) => void;
  onError: (message: string) => void;
}

const validateImage = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return 'Use a PNG, JPEG, or WebP photo.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image size cannot exceed 10 MB.';
  }
  return null;
};

export const InitialScreen = ({
  hasApiKey,
  usingSessionKey,
  usingEnvKey,
  onApiKeySave,
  onApiKeyClear,
  onImageSelected,
  onError,
}: InitialScreenProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  const selectFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      const problem = validateImage(file);
      if (problem) {
        onError(problem);
        return;
      }
      onImageSelected(file, URL.createObjectURL(file));
    },
    [onError, onImageSelected],
  );

  const useSample = async () => {
    setLoadingSample(true);
    try {
      const response = await fetch(DEFAULT_HOUSE_IMAGE_URL);
      if (!response.ok) throw new Error(`Sample image request failed (${response.status}).`);
      const blob = await response.blob();
      const file = new File([blob], 'sample-house.jpg', { type: blob.type || 'image/jpeg' });
      onImageSelected(file, URL.createObjectURL(file));
    } catch (error) {
      console.error(error);
      onError('Could not load the sample house. Upload a photo instead.');
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-5xl">See the exterior before you buy it</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
          Upload a house photo, pick siding, roofing, trim, and a door, and browse the studio immediately. Add a Gemini key when you want the photo repainted.
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-3xl">
        <ApiKeyPanel
          hasApiKey={hasApiKey}
          usingSessionKey={usingSessionKey}
          usingEnvKey={usingEnvKey}
          onSave={onApiKeySave}
          onClear={onApiKeyClear}
        />
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-5xl gap-4 md:grid-cols-2">
        <label
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            selectFile(event.dataTransfer.files?.[0]);
          }}
          className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition focus-within:border-blue-300 ${
            isDragging ? 'border-blue-300 bg-blue-950/40' : 'border-slate-600 bg-slate-900/50 hover:border-slate-400'
          }`}
        >
          <span className="text-lg font-semibold text-slate-100">Upload a photo</span>
          <span className="mt-2 text-sm text-slate-300">Drag and drop, or choose a PNG, JPEG, or WebP up to 10 MB.</span>
          <input
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="sr-only"
            onChange={(event) => {
              selectFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>

        <button
          type="button"
          onClick={useSample}
          disabled={loadingSample}
          className="group relative min-h-64 overflow-hidden rounded-2xl border border-slate-600 text-left disabled:cursor-wait"
        >
          <img
            src={DEFAULT_HOUSE_IMAGE_URL}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10" />
          <span className="relative flex h-full flex-col justify-end p-6">
            <span className="text-lg font-semibold text-white">{loadingSample ? 'Loading sample…' : 'Use the sample house'}</span>
            <span className="mt-1 text-sm text-slate-200">A bundled exterior photo, so the demo works offline from the catalog.</span>
          </span>
        </button>
      </div>
    </div>
  );
};

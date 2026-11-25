import { useId, useState } from 'react';
import { AI_STUDIO_KEY_URL } from '../constants';

interface ApiKeyPanelProps {
  hasApiKey: boolean;
  usingSessionKey: boolean;
  usingEnvKey: boolean;
  onSave: (key: string) => void;
  onClear: () => void;
}

export const ApiKeyPanel = ({
  hasApiKey,
  usingSessionKey,
  usingEnvKey,
  onSave,
  onClear,
}: ApiKeyPanelProps) => {
  const inputId = useId();
  const helpId = useId();
  const [draft, setDraft] = useState('');
  const [showForm, setShowForm] = useState(!hasApiKey);
  const [localError, setLocalError] = useState<string | null>(null);

  const save = () => {
    const next = draft.trim();
    if (next.length < 10) {
      setLocalError('Enter the full API key from Google AI Studio.');
      return;
    }
    setLocalError(null);
    setDraft('');
    setShowForm(false);
    onSave(next);
  };

  return (
    <section className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 p-5 text-left shadow-lg backdrop-blur-sm" aria-labelledby={`${inputId}-title`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={`${inputId}-title`} className="text-lg font-semibold text-slate-100">
            Gemini API key
          </h3>
          <p id={helpId} className="mt-1 max-w-2xl text-sm text-slate-300">
            Preview mode works without a key. A key is only used to analyze the photo and render materials.
            It stays in this browser tab and is sent to Google, not to this site&apos;s server.
          </p>
        </div>
        <a
          href={AI_STUDIO_KEY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
        >
          Get a key
        </a>
      </div>

      {usingEnvKey && !showForm && (
        <p className="mt-4 text-sm text-emerald-300" role="status">
          This deployment includes a Gemini API key, so AI features are on.
        </p>
      )}

      {usingSessionKey && !showForm && (
        <p className="mt-4 text-sm text-emerald-300" role="status">
          A key is saved for this browser tab.
        </p>
      )}

      {hasApiKey && !showForm ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
          >
            Use a different key
          </button>
          {usingSessionKey && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setShowForm(true);
              }}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
            >
              Remove saved key
            </button>
          )}
        </div>
      ) : (
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="flex-1">
            <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-200">
              API key
            </label>
            <input
              id={inputId}
              type="password"
              value={draft}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={helpId}
              aria-invalid={localError ? true : undefined}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Paste your Gemini API key"
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500"
            />
            {localError && (
              <p className="mt-2 text-sm text-red-300" role="alert">
                {localError}
              </p>
            )}
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Save key
            </button>
            {hasApiKey && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setLocalError(null);
                  setDraft('');
                }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
};

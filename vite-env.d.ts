/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional Gemini API key baked into the static bundle at build time.
   * Leave this unset for a public demo. Visitors can paste their own key.
   */
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

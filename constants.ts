/** Bundled sample photo. Resolved against Vite's base so GitHub Pages and Vercel both work. */
export const DEFAULT_HOUSE_IMAGE_URL = `${import.meta.env.BASE_URL}sample-house.jpg`;

/**
 * Current high-efficiency Gemini image model (Nano Banana 2.1).
 * `gemini-2.5-flash-image-preview` was shut down on January 15, 2026.
 */
export const GEMINI_IMAGE_MODEL = 'gemini-nano-banana-2.1';

export const AI_STUDIO_KEY_URL = 'https://aistudio.google.com/app/apikey';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

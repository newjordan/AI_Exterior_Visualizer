const STORAGE_KEY = 'gemini_api_key';

export function hasConfiguredEnvKey(): boolean {
  const value = import.meta.env.VITE_GEMINI_API_KEY;
  return typeof value === 'string' && value.trim().length > 0;
}

export function getSessionApiKey(): string | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)?.trim();
    return stored || null;
  } catch {
    return null;
  }
}

/**
 * Session key wins over the build-time env key so a visitor can replace a
 * deployment key, and so local `.env` use still allows a one-off override.
 */
export function getApiKey(): string | null {
  return getSessionApiKey() ?? (hasConfiguredEnvKey() ? import.meta.env.VITE_GEMINI_API_KEY!.trim() : null);
}

export function setSessionApiKey(key: string): void {
  sessionStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearSessionApiKey(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures; the in-memory UI state still updates.
  }
}

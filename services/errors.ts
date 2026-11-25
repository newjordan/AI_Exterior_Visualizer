import { GEMINI_IMAGE_MODEL } from '../constants';

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error && /abort/i.test(`${error.name} ${error.message}`)) return true;
  return false;
}

export function toUserMessage(error: unknown): string {
  if (isAbortError(error)) return 'The request was cancelled.';
  const raw = error instanceof Error ? error.message : 'Something went wrong while talking to Gemini.';
  if (/API key|API_KEY|401|403|UNAUTHENTICATED|permission denied/i.test(raw)) {
    return 'The Gemini API key was rejected. Check it in Google AI Studio and try again.';
  }
  if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) {
    return 'The Gemini API rate limit was reached. Wait a moment, then try again.';
  }
  if (/not found|404|is not supported|invalid model/i.test(raw) && /model|gemini-/i.test(raw)) {
    return `The image model (${GEMINI_IMAGE_MODEL}) is unavailable. Update GEMINI_IMAGE_MODEL in constants.ts.`;
  }
  return raw;
}


export interface ProductOption {
  value: string;
  label: string;
  imageUrls: string[];
  colors: string[];
}

export interface ProductCategory {
  label: string;
  options: ProductOption[];
}

export interface ProductData {
  siding: ProductCategory[];
  roofing: ProductCategory[];
  trim: ProductCategory[];
  door: ProductCategory[];
}

export interface DesignOptions {
  sidingProduct: string;
  sidingColor: string;
  roofingProduct: string;
  roofingColor: string;
  trimProduct: string;
  trimColor: string;
  doorProduct: string;
  doorColor: string;
}

// FIX: Removed the broad index signature "[key: string]: string | undefined;".
// This makes the type more specific and prevents incorrect TypeScript type inference
// for objects with computed properties, resolving the errors in App.tsx.
export interface HouseMasks {
  siding?: string; // base64 encoded image
  roofing?: string;
  trim?: string;
  door?: string;
}

export type MaskingStatus = 'pending' | 'generating' | 'complete' | 'error';

// FIX: Made properties required with the "-?" modifier to match the type's usage (e.g., initialProgress in App.tsx).
// This ensures type safety and correctness when updating the masking progress state.
export type MaskingProgress = {
  [key in keyof HouseMasks]-?: MaskingStatus;
};

export type GenerationProgress = {
  active: boolean;
  message: string;
  percentage: number;
};


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

export interface HouseMasks {
  siding?: string; // base64 encoded image
  roofing?: string;
  trim?: string;
  door?: string;
  [key: string]: string | undefined;
}

export type MaskingStatus = 'pending' | 'generating' | 'complete' | 'error';

export type MaskingProgress = {
  [key in keyof HouseMasks]: MaskingStatus;
};

export type GenerationProgress = {
  active: boolean;
  message: string;
  percentage: number;
};

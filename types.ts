export interface DesignOptions {
  sidingProduct: string;
  sidingColor: string;
  trimProduct: string;
  trimColor: string;
  doorProduct: string;
  doorColor: string;
  roofingProduct: string;
  roofingColor: string;
}

export interface ProductImageUrls {
  sidingImageUrl: string;
  trimImageUrl: string;
  doorImageUrl: string;
  roofingImageUrl: string;
}

export interface ProductOption {
    value: string;
    label: string;
    colors: string[];
    imageUrl: string;
}

export interface ProductCategory {
    label: string;
    options: ProductOption[];
}

export type ProductCategoryKey = 'siding' | 'roofing' | 'trim' | 'door';

import React, { useRef } from 'react';
import type { DesignOptions, ProductCategory, ProductOption, ProductData } from '../types';
import { CameraIcon } from './icons/CameraIcon';

interface DesignFormProps {
  options: DesignOptions;
  setOptions: React.Dispatch<React.SetStateAction<DesignOptions>>;
  productData: ProductData;
  onMaterialCaptured: (category: keyof ProductData, file: File) => void;
}

const findColorsForProduct = (categories: ProductCategory[], productName: string): string[] => {
    for (const category of categories) {
        const product = category.options.find((p) => p.value === productName);
        if (product) {
            return product.colors;
        }
    }
    return [];
};

const ProductCard: React.FC<{ product: ProductOption, isSelected: boolean, onSelect: () => void }> = ({ product, isSelected, onSelect }) => (
    <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSelected ? 'border-blue-600 shadow-lg' : 'border-gray-200 hover:border-blue-500 hover:shadow-md'}`}
        aria-pressed={isSelected}
    >
        <div className="h-24 w-full bg-gray-100">
            <img src={product.imageUrls[0]} alt={product.label} className="object-cover w-full h-full" />
        </div>
        <div className="p-3 bg-white">
            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{product.label}</p>
        </div>
    </button>
);

const CaptureCard: React.FC<{ onFileCaptured: (file: File) => void }> = ({ onFileCaptured }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileCaptured(file);
        }
    };
    
    return (
        <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-full text-left rounded-lg p-3 border-2 border-dashed border-slate-400 bg-slate-200 hover:bg-slate-300 hover:border-slate-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            <CameraIcon className="w-10 h-10 text-slate-600 mb-2" />
            <span className="text-sm font-semibold text-slate-700 text-center">Use Your Own</span>
             <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
             />
        </button>
    )
}

const ColorSwatch: React.FC<{ color: string, isSelected: boolean, onSelect: () => void }> = ({ color, isSelected, onSelect }) => (
    <button
        type="button"
        onClick={onSelect}
        className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}
        title={color}
        aria-pressed={isSelected}
    >
        {color}
    </button>
);

export const DesignForm: React.FC<DesignFormProps> = ({ options, setOptions, productData, onMaterialCaptured }) => {

    const handleProductChange = (field: keyof DesignOptions, value: string) => {
        let categories: ProductCategory[] = [];
        let colorField: keyof DesignOptions = 'sidingColor';

        if (field === 'sidingProduct') {
            categories = productData.siding;
            colorField = 'sidingColor';
        } else if (field === 'trimProduct') {
            categories = productData.trim;
            colorField = 'trimColor';
        } else if (field === 'doorProduct') {
            categories = productData.door;
            colorField = 'doorColor';
        } else if (field === 'roofingProduct') {
            categories = productData.roofing;
            colorField = 'roofingColor';
        }
        
        const newColors = findColorsForProduct(categories, value);
        
        setOptions(prev => ({
            ...prev,
            [field]: value,
            [colorField]: newColors[0] || 'Custom',
        }));
    };
    
    const handleColorChange = (field: keyof DesignOptions, value: string) => {
        setOptions(prev => ({ ...prev, [field]: value }));
    };

    const handleFileCaptured = (categoryKey: keyof ProductData, field: keyof DesignOptions, file: File) => {
        onMaterialCaptured(categoryKey, file);
        // Auto-select the newly captured material
        setOptions(prev => ({
            ...prev,
            [field]: `custom-${categoryKey}`,
            [`${categoryKey}Color`]: 'Custom'
        }));
    };

    const sidingColors = findColorsForProduct(productData.siding, options.sidingProduct);
    const trimColors = findColorsForProduct(productData.trim, options.trimProduct);
    const doorColors = findColorsForProduct(productData.door, options.doorProduct);
    const roofingColors = findColorsForProduct(productData.roofing, options.roofingProduct);

    const renderProductGroup = (
        title: string, 
        categoryKey: keyof ProductData,
        productField: keyof DesignOptions,
        colorField: keyof DesignOptions
    ) => {
        const categories = productData[categoryKey];
        const selectedProduct = options[productField];
        const selectedColor = options[colorField];
        const availableColors = findColorsForProduct(categories, selectedProduct);

        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
                <div className="space-y-4">
                    {categories.map(category => (
                        <div key={category.label}>
                            <h4 className="text-md font-semibold text-gray-600 mb-3">{category.label}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {category.options.map(product => (
                                    <ProductCard
                                        key={product.value}
                                        product={product}
                                        isSelected={selectedProduct === product.value}
                                        onSelect={() => handleProductChange(productField, product.value)}
                                    />
                                ))}
                                <CaptureCard onFileCaptured={(file) => handleFileCaptured(categoryKey, productField, file)} />
                            </div>
                        </div>
                    ))}
                </div>

                {availableColors.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-md font-semibold text-gray-600 mb-3">Color</h4>
                        <div className="flex flex-wrap gap-3">
                            {availableColors.map(color => (
                                <ColorSwatch
                                    key={color}
                                    color={color}
                                    isSelected={selectedColor === color}
                                    onSelect={() => handleColorChange(colorField, color)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-700 mb-6">2. Choose Your Products</h2>
            <div className="space-y-8">
                {renderProductGroup("Siding", 'siding', 'sidingProduct', 'sidingColor')}
                
                <div className="pt-8 border-t border-gray-200">
                    {renderProductGroup("Roofing", 'roofing', 'roofingProduct', 'roofingColor')}
                </div>

                <div className="pt-8 border-t border-gray-200">
                    {renderProductGroup("Trim", 'trim', 'trimProduct', 'trimColor')}
                </div>

                <div className="pt-8 border-t border-gray-200">
                    {renderProductGroup("Front Door", 'door', 'doorProduct', 'doorColor')}
                </div>
            </div>
        </div>
    );
};
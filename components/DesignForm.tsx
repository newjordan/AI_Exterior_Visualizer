import React from 'react';
import type { DesignOptions, ProductCategory, ProductOption, ProductData } from '../types';

interface DesignFormProps {
  options: DesignOptions;
  setOptions: React.Dispatch<React.SetStateAction<DesignOptions>>;
  productData: ProductData;
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
            {/* FIX: Use `imageUrls[0]` instead of non-existent `imageUrl` to match the ProductOption type. */}
            <img src={product.imageUrls[0]} alt={product.label} className="object-cover w-full h-full" />
        </div>
        <div className="p-3 bg-white">
            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{product.label}</p>
        </div>
    </button>
);

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

export const DesignForm: React.FC<DesignFormProps> = ({ options, setOptions, productData }) => {

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
            [colorField]: newColors[0] || '',
        }));
    };
    
    const handleColorChange = (field: keyof DesignOptions, value: string) => {
        setOptions(prev => ({ ...prev, [field]: value }));
    };

    const sidingColors = findColorsForProduct(productData.siding, options.sidingProduct);
    const trimColors = findColorsForProduct(productData.trim, options.trimProduct);
    const doorColors = findColorsForProduct(productData.door, options.doorProduct);
    const roofingColors = findColorsForProduct(productData.roofing, options.roofingProduct);

    const renderProductGroup = (title: string, categories: ProductCategory[], selectedProduct: string, onProductChange: (value: string) => void, availableColors: string[], selectedColor: string, onColorChange: (value: string) => void) => (
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
                                    onSelect={() => onProductChange(product.value)}
                                />
                            ))}
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
                                onSelect={() => onColorChange(color)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-700 mb-6">2. Choose Your Products</h2>
            <div className="space-y-8">
                {renderProductGroup("Siding", productData.siding, options.sidingProduct, (value) => handleProductChange('sidingProduct', value), sidingColors, options.sidingColor, (value) => handleColorChange('sidingColor', value))}
                
                <div className="pt-8 border-t border-gray-200">
                    {renderProductGroup("Roofing", productData.roofing, options.roofingProduct, (value) => handleProductChange('roofingProduct', value), roofingColors, options.roofingColor, (value) => handleColorChange('roofingColor', value))}
                </div>

                <div className="pt-8 border-t border-gray-200">
                    {renderProductGroup("Trim", productData.trim, options.trimProduct, (value) => handleProductChange('trimProduct', value), trimColors, options.trimColor, (value) => handleColorChange('trimColor', value))}
                </div>

                <div className="pt-8 border-t border-gray-200">
                    {renderProductGroup("Front Door", productData.door, options.doorProduct, (value) => handleProductChange('doorProduct', value), doorColors, options.doorColor, (value) => handleColorChange('doorColor', value))}
                </div>
            </div>
        </div>
    );
};

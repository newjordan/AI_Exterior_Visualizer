import React, { useState } from 'react';
import type { DesignOptions, ProductCategory, ProductOption, ProductCategoryKey } from '../types';
import { SIDING_OPTIONS, TRIM_OPTIONS, DOOR_OPTIONS, ROOFING_OPTIONS } from '../constants';
import { SidingIcon } from './icons/SidingIcon';
import { RoofingIcon } from './icons/RoofingIcon';
import { TrimIcon } from './icons/TrimIcon';
import { DoorIcon } from './icons/DoorIcon';
import { Loader } from './Loader';
import { ResultDisplay } from './ResultDisplay';

interface DesignStudioProps {
  imageUrl: string;
  options: DesignOptions;
  setOptions: React.Dispatch<React.SetStateAction<DesignOptions>>;
  onVisualize: () => void;
  isLoading: boolean;
  generatedImageUrl: string | null;
  onStartOver: () => void;
}

const findColorsForProduct = (categories: ProductCategory[], productName: string): string[] => {
    for (const category of categories) {
        const product = category.options.find((p) => p.value === productName);
        if (product) return product.colors;
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
            <img src={product.imageUrl} alt={product.label} className="object-cover w-full h-full" />
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

const categoryMap: Record<ProductCategoryKey, { title: string; icon: React.FC<any>; options: ProductCategory[], productKey: keyof DesignOptions, colorKey: keyof DesignOptions }> = {
    siding: { title: "Siding", icon: SidingIcon, options: SIDING_OPTIONS, productKey: 'sidingProduct', colorKey: 'sidingColor'},
    roofing: { title: "Roofing", icon: RoofingIcon, options: ROOFING_OPTIONS, productKey: 'roofingProduct', colorKey: 'roofingColor' },
    trim: { title: "Trim", icon: TrimIcon, options: TRIM_OPTIONS, productKey: 'trimProduct', colorKey: 'trimColor'},
    door: { title: "Front Door", icon: DoorIcon, options: DOOR_OPTIONS, productKey: 'doorProduct', colorKey: 'doorColor'},
};

export const DesignStudio: React.FC<DesignStudioProps> = ({ imageUrl, options, setOptions, onVisualize, isLoading, generatedImageUrl, onStartOver }) => {
    const [activeCategory, setActiveCategory] = useState<ProductCategoryKey | null>(null);

    const toggleCategory = (category: ProductCategoryKey) => {
        setActiveCategory(prev => (prev === category ? null : category));
    };
    
    const handleProductChange = (field: keyof DesignOptions, colorField: keyof DesignOptions, value: string, categories: ProductCategory[]) => {
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

    const renderProductGroup = (categoryKey: ProductCategoryKey) => {
        const { title, options: categories, productKey, colorKey } = categoryMap[categoryKey];
        const selectedProduct = options[productKey];
        const selectedColor = options[colorKey];
        const availableColors = findColorsForProduct(categories, selectedProduct);

        return (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mt-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{`Choose Your ${title}`}</h3>
                <div className="space-y-4">
                    {categories.map(category => (
                        <div key={category.label}>
                            <h4 className="text-md font-semibold text-gray-600 mb-3">{category.label}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {category.options.map(product => (
                                    <ProductCard
                                        key={product.value}
                                        product={product}
                                        isSelected={selectedProduct === product.value}
                                        onSelect={() => handleProductChange(productKey, colorKey, product.value, categories)}
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
                                    onSelect={() => handleColorChange(colorKey, color)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    };
    
    return (
        <div className="w-full flex flex-col items-center">
             <div className="w-full flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-gray-800">Design Studio</h2>
                <button 
                  onClick={onStartOver}
                  className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
                >
                  &larr; Start Over
                </button>
            </div>
            
            <div className="w-full max-w-4xl aspect-[16/9] rounded-xl shadow-2xl overflow-hidden mb-6">
                <img src={imageUrl} alt="Your house" className="w-full h-full object-cover" />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 w-full max-w-4xl">
                <p className="text-center text-gray-600 font-semibold mb-3">Select a category to start designing:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(categoryMap).map(([key, { title, icon: Icon }]) => (
                         <button 
                            key={key}
                            onClick={() => toggleCategory(key as ProductCategoryKey)}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${activeCategory === key ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-300'}`}
                         >
                            <Icon className="h-8 w-8 mb-2" />
                            <span className="font-bold">{title}</span>
                         </button>
                    ))}
                </div>
            </div>

            {activeCategory && (
                <div className="w-full max-w-4xl">
                    {renderProductGroup(activeCategory)}
                </div>
            )}
            
            <div className="mt-8 w-full max-w-4xl">
                <button
                    onClick={onVisualize}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out text-lg flex items-center justify-center gap-3"
                >
                    {isLoading ? (
                        <>
                            <Loader/>
                            Visualizing...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104l-1.385 2.423A2.25 2.25 0 016.732 7.5H3.104a2.25 2.25 0 00-1.664 3.836l2.423 1.385A2.25 2.25 0 017.5 14.268v3.628a2.25 2.25 0 003.836 1.664l1.385-2.423A2.25 2.25 0 0114.268 16.5h3.628a2.25 2.25 0 001.664-3.836l-2.423-1.385A2.25 2.25 0 0116.5 9.732V6.104a2.25 2.25 0 00-3.836-1.664L11.28 6.864A2.25 2.25 0 019.75 3.104zM12 12a3 3 0 100-6 3 3 0 000 6z" /></svg>
                            Visualize My Home!
                        </>
                    )}
                </button>
            </div>
            {generatedImageUrl && (
                <div className="mt-12 w-full max-w-5xl">
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Your Redesigned Home</h2>
                    <ResultDisplay originalUrl={imageUrl} generatedUrl={generatedImageUrl} />
                </div>
            )}
        </div>
    );
};
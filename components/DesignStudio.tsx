import React, { useState, useMemo } from 'react';
import type { DesignOptions, ProductCategory, ProductOption, ProductData, ProductCategoryKey } from '../types';
import { visualizeExteriorDesign } from '../services/geminiService';
import { ResultDisplay } from './ResultDisplay';
import { Loader } from './Loader';
import { SidingIcon } from './icons/SidingIcon';
import { RoofingIcon } from './icons/RoofingIcon';
import { TrimIcon } from './icons/TrimIcon';
import { DoorIcon } from './icons/DoorIcon';

interface DesignStudioProps {
  originalImage: { file: File; url: string };
  onGenerationComplete: (url: string) => void;
  generatedImageUrl: string | null;
  productData: ProductData;
  onReset: () => void;
}

const findColorsForProduct = (categories: ProductCategory[], productName: string): string[] => {
    for (const category of categories) {
        const product = category.options.find((p) => p.value === productName);
        if (product) return product.colors;
    }
    return [];
};

const findImageUrlForProduct = (categories: ProductCategory[], productName: string): string | undefined => {
    for (const category of categories) {
        const product = category.options.find((p) => p.value === productName);
        if (product) return product.imageUrl;
    }
    return undefined;
};

const ProductCard: React.FC<{ product: ProductOption, isSelected: boolean, onSelect: () => void }> = ({ product, isSelected, onSelect }) => (
    <button
        type="button"
        onClick={onSelect}
        className={`group block w-full text-left rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-400 ${isSelected ? 'border-blue-500 shadow-lg' : 'border-slate-600/80 hover:border-slate-500 hover:shadow-md bg-slate-900/20'}`}
        aria-pressed={isSelected}
    >
        <div className="h-24 w-full bg-slate-700 overflow-hidden">
            <img src={product.imageUrl} alt={product.label} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-3">
            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>{product.label}</p>
        </div>
    </button>
);

const ColorSwatch: React.FC<{ color: string, isSelected: boolean, onSelect: () => void }> = ({ color, isSelected, onSelect }) => (
    <button
        type="button"
        onClick={onSelect}
        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-400 ${isSelected ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700 hover:border-slate-500'}`}
        title={color}
        aria-pressed={isSelected}
    >
        {color}
    </button>
);

export const DesignStudio: React.FC<DesignStudioProps> = ({ originalImage, onGenerationComplete, generatedImageUrl, productData, onReset }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<ProductCategoryKey>('siding');

    const [designOptions, setDesignOptions] = useState<DesignOptions>(() => {
        return {
            sidingProduct: productData.siding[0].options[0].value,
            sidingColor: productData.siding[0].options[0].colors[0],
            trimProduct: productData.trim[0].options[0].value,
            trimColor: productData.trim[0].options[0].colors[0],
            doorProduct: productData.door[0].options[0].value,
            doorColor: productData.door[0].options[0].colors[0],
            roofingProduct: productData.roofing[0].options[0].value,
            roofingColor: productData.roofing[0].options[0].colors[0],
        };
    });
    
    const handleGenerateClick = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(originalImage.file);
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                if (!base64String) {
                    throw new Error("Failed to read image file.");
                }

                const imageUrls = {
                    sidingImageUrl: findImageUrlForProduct(productData.siding, designOptions.sidingProduct),
                    trimImageUrl: findImageUrlForProduct(productData.trim, designOptions.trimProduct),
                    doorImageUrl: findImageUrlForProduct(productData.door, designOptions.doorProduct),
                    roofingImageUrl: findImageUrlForProduct(productData.roofing, designOptions.roofingProduct),
                };

                const resultBase64 = await visualizeExteriorDesign(base64String, originalImage.file.type, designOptions, imageUrls);
                onGenerationComplete(`data:image/webp;base64,${resultBase64}`);
            };
            reader.onerror = () => {
                 throw new Error("Error reading the selected file.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during visualization.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleProductChange = (categoryKey: ProductCategoryKey, value: string) => {
        const categories = productData[categoryKey];
        const colorField: keyof DesignOptions = `${categoryKey}Color`;
        const productField: keyof DesignOptions = `${categoryKey}Product`;
        const newColors = findColorsForProduct(categories, value);
        
        setDesignOptions(prev => ({
            ...prev,
            [productField]: value,
            [colorField]: newColors[0] || '',
        }));
    };
    
    const handleColorChange = (colorField: keyof DesignOptions, value: string) => {
        setDesignOptions(prev => ({ ...prev, [colorField]: value }));
    };

    const categoryConfig = useMemo(() => ({
        siding: {
            title: "Siding",
            icon: SidingIcon,
            categories: productData.siding,
            selectedProduct: designOptions.sidingProduct,
            onProductChange: (v: string) => handleProductChange('siding', v),
            availableColors: findColorsForProduct(productData.siding, designOptions.sidingProduct),
            selectedColor: designOptions.sidingColor,
            onColorChange: (v: string) => handleColorChange('sidingColor', v),
        },
        roofing: {
            title: "Roofing",
            icon: RoofingIcon,
            categories: productData.roofing,
            selectedProduct: designOptions.roofingProduct,
            onProductChange: (v: string) => handleProductChange('roofing', v),
            availableColors: findColorsForProduct(productData.roofing, designOptions.roofingProduct),
            selectedColor: designOptions.roofingColor,
            onColorChange: (v: string) => handleColorChange('roofingColor', v),
        },
        trim: {
            title: "Trim",
            icon: TrimIcon,
            categories: productData.trim,
            selectedProduct: designOptions.trimProduct,
            onProductChange: (v: string) => handleProductChange('trim', v),
            availableColors: findColorsForProduct(productData.trim, designOptions.trimProduct),
            selectedColor: designOptions.trimColor,
            onColorChange: (v: string) => handleColorChange('trimColor', v),
        },
        door: {
            title: "Front Door",
            icon: DoorIcon,
            categories: productData.door,
            selectedProduct: designOptions.doorProduct,
            onProductChange: (v: string) => handleProductChange('door', v),
            availableColors: findColorsForProduct(productData.door, designOptions.doorProduct),
            selectedColor: designOptions.doorColor,
            onColorChange: (v: string) => handleColorChange('doorColor', v),
        },
    }), [designOptions, productData]);
    
    const activeConfig = categoryConfig[activeCategory];
    
    return (
        <div className="flex-grow flex flex-col gap-8 w-full">
             <div className="w-full max-w-2xl mx-auto">
                <img src={originalImage.url} alt="Your selected house" className="rounded-xl shadow-2xl w-full" />
            </div>

            <div className="p-6 rounded-xl bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-2xl">
                <div className="flex items-center border-b border-slate-700/50 mb-6">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setActiveCategory(key as ProductCategoryKey)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeCategory === key ? 'border-blue-400 text-blue-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                            aria-current={activeCategory === key}
                        >
                            <config.icon className="w-5 h-5" />
                            <span>{config.title}</span>
                        </button>
                    ))}
                </div>
                <div>
                     {activeConfig.categories.map(category => (
                        <div key={category.label}>
                            <h4 className="text-md font-semibold text-slate-300 mb-3">{category.label}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {category.options.map(product => (
                                    <ProductCard
                                        key={product.value}
                                        product={product}
                                        isSelected={activeConfig.selectedProduct === product.value}
                                        onSelect={() => activeConfig.onProductChange(product.value)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                     {activeConfig.availableColors.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-md font-semibold text-slate-300 mb-3">Color</h4>
                            <div className="flex flex-wrap gap-3">
                                {activeConfig.availableColors.map(color => (
                                    <ColorSwatch
                                        key={color}
                                        color={color}
                                        isSelected={activeConfig.selectedColor === color}
                                        onSelect={() => activeConfig.onColorChange(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 mt-4">
                <button
                    onClick={handleGenerateClick}
                    disabled={isLoading}
                    className="w-full max-w-md flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                    {isLoading ? (
                        <>
                            <Loader size="sm" />
                            <span className="ml-3">Visualizing...</span>
                        </>
                    ) : (
                        "Visualize My Home!"
                    )}
                </button>
                {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            </div>

            {generatedImageUrl && (
                <ResultDisplay
                    originalImageUrl={originalImage.url}
                    generatedImageUrl={generatedImageUrl}
                />
            )}
        </div>
    );
};

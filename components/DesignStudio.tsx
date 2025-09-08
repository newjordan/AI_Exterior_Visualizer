import React, { useState, useEffect, useMemo } from 'react';
import { Loader } from './Loader';
import type { DesignOptions, ProductData, GenerationProgress, ProductOption, ProductCategory } from '../types';
import { SidingIcon } from './icons/SidingIcon';
import { RoofingIcon } from './icons/RoofingIcon';
import { TrimIcon } from './icons/TrimIcon';
import { DoorIcon } from './icons/DoorIcon';
import { CameraIcon } from './icons/CameraIcon';

interface DesignStudioProps {
  imageUrl: string;
  productData: ProductData;
  onGenerate: (options: DesignOptions) => void;
  generationProgress: GenerationProgress;
  customMaterials: Partial<Record<keyof ProductData, File>>;
  onCustomMaterialAdded: (category: keyof ProductData, file: File) => void;
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

const augmentProductData = (baseData: ProductData, customMaterials: Partial<Record<keyof ProductData, File>>): ProductData => {
    const augmentedData = JSON.parse(JSON.stringify(baseData));
    const categoryKeys = Object.keys(customMaterials) as Array<keyof ProductData>;

    categoryKeys.forEach(category => {
        const file = customMaterials[category];
        if (file) {
            const customOption: ProductOption = {
                value: `custom-${category}`,
                label: `My ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                imageUrls: [URL.createObjectURL(file)],
                colors: ['Custom'],
            };
            if (!augmentedData[category][0]) {
                augmentedData[category][0] = { label: 'Custom', options: [] };
            }
            augmentedData[category][0].options = augmentedData[category][0].options.filter(
                (opt: ProductOption) => !opt.value.startsWith('custom-')
            );
            augmentedData[category][0].options.unshift(customOption);
        }
    });
    return augmentedData;
};

const CategoryIcon: React.FC<{ category: keyof ProductData, className?: string }> = ({ category, className }) => {
    switch (category) {
        case 'siding': return <SidingIcon className={className} />;
        case 'roofing': return <RoofingIcon className={className} />;
        case 'trim': return <TrimIcon className={className} />;
        case 'door': return <DoorIcon className={className} />;
        default: return null;
    }
};

export const DesignStudio: React.FC<DesignStudioProps> = ({
  imageUrl,
  productData,
  onGenerate,
  generationProgress,
  customMaterials,
  onCustomMaterialAdded
}) => {
  const [activeCategory, setActiveCategory] = useState<keyof ProductData>('siding');
  const [options, setOptions] = useState<DesignOptions>({
    sidingProduct: productData.siding[0]?.options[0]?.value || '',
    sidingColor: productData.siding[0]?.options[0]?.colors[0] || '',
    roofingProduct: productData.roofing[0]?.options[0]?.value || '',
    roofingColor: productData.roofing[0]?.options[0]?.colors[0] || '',
    trimProduct: productData.trim[0]?.options[0]?.value || '',
    trimColor: productData.trim[0]?.options[0]?.colors[0] || '',
    doorProduct: productData.door[0]?.options[0]?.value || '',
    doorColor: productData.door[0]?.options[0]?.colors[0] || '',
  });

  const augmentedData = useMemo(() => augmentProductData(productData, customMaterials), [productData, customMaterials]);

  useEffect(() => {
    return () => {
        Object.values(customMaterials).forEach(file => {
            if (file) URL.revokeObjectURL(URL.createObjectURL(file));
        });
    };
  }, [customMaterials]);

  const handleProductChange = (category: keyof ProductData, value: string) => {
    const productField = `${category}Product` as keyof DesignOptions;
    const colorField = `${category}Color` as keyof DesignOptions;
    const newColors = findColorsForProduct(augmentedData[category], value);
    setOptions(prev => ({
        ...prev,
        [productField]: value,
        [colorField]: newColors[0] || 'Custom',
    }));
  };

  const handleColorChange = (category: keyof ProductData, value: string) => {
    const colorField = `${category}Color` as keyof DesignOptions;
    setOptions(prev => ({ ...prev, [colorField]: value }));
  };
  
  const handleFileCaptured = (category: keyof ProductData, file: File) => {
    onCustomMaterialAdded(category, file);
    handleProductChange(category, `custom-${category}`);
  };

  const renderCurrentCategoryPanel = () => {
    const categories = augmentedData[activeCategory];
    const productField = `${activeCategory}Product` as keyof DesignOptions;
    const colorField = `${activeCategory}Color` as keyof DesignOptions;
    const selectedProduct = options[productField];
    const selectedColor = options[colorField];
    const availableColors = findColorsForProduct(categories, selectedProduct);

    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-b-xl">
        {categories.map(catGroup => (
          <div key={catGroup.label} className="mb-6 last:mb-0">
            <h4 className="text-md font-semibold text-slate-300 mb-3">{catGroup.label}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {catGroup.options.map(product => (
                 <button
                    key={product.value}
                    type="button"
                    onClick={() => handleProductChange(activeCategory, product.value)}
                    className={`block w-full text-left rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${selectedProduct === product.value ? 'border-blue-500 shadow-lg' : 'border-slate-600 hover:border-blue-500'}`}
                 >
                    <div className="h-24 w-full bg-slate-700"><img src={product.imageUrls[0]} alt={product.label} className="object-cover w-full h-full" /></div>
                    <div className="p-3 bg-slate-700/50"><p className={`text-sm font-semibold truncate ${selectedProduct === product.value ? 'text-blue-300' : 'text-slate-200'}`}>{product.label}</p></div>
                 </button>
              ))}
               <button
                  type="button"
                  onClick={() => (document.getElementById(`${activeCategory}-capture-input`) as HTMLInputElement)?.click()}
                  className="flex flex-col items-center justify-center w-full h-full text-left rounded-lg p-3 border-2 border-dashed border-slate-500 bg-slate-700/30 hover:bg-slate-700/60 hover:border-slate-400 transition-colors"
               >
                  <CameraIcon className="w-10 h-10 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-300 text-center">Use Your Own</span>
                  <input id={`${activeCategory}-capture-input`} type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files && handleFileCaptured(activeCategory, e.target.files[0])} className="hidden" />
               </button>
            </div>
          </div>
        ))}
        {availableColors.length > 1 && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
                <h4 className="text-md font-semibold text-slate-300 mb-3">Color</h4>
                <div className="flex flex-wrap gap-3">
                    {availableColors.map(color => (
                        <button
                            key={color} type="button" onClick={() => handleColorChange(activeCategory, color)}
                            className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${selectedColor === color ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'}`}
                        >{color}</button>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-5xl mx-auto">
            <div className="mb-6 rounded-xl overflow-hidden aspect-video bg-slate-800 border border-slate-700/50 shadow-2xl flex items-center justify-center">
                <img src={imageUrl} alt="Your house" className="object-contain h-full w-full" />
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl">
                <div className="grid grid-cols-4 border-b border-slate-700/50">
                    {(Object.keys(productData) as Array<keyof ProductData>).map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveCategory(key)}
                            className={`flex flex-col items-center justify-center text-center p-4 transition-colors duration-200 ${activeCategory === key ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'}`}
                        >
                            <CategoryIcon category={key} className={`h-8 w-8 mb-2 ${activeCategory === key ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className={`font-semibold capitalize ${activeCategory === key ? 'text-blue-300' : 'text-slate-300'}`}>{key}</span>
                        </button>
                    ))}
                </div>
                {renderCurrentCategoryPanel()}
            </div>

            <div className="mt-8 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl p-6">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Generate Your Design</h2>
                <p className="text-slate-300 mb-6">Once you're happy with your selections, let our AI create your new home exterior.</p>
                <button
                    onClick={() => onGenerate(options)}
                    disabled={generationProgress.active}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-lg"
                >
                    {generationProgress.active ? <><Loader size="sm" /><span className="ml-3">Visualizing...</span></> : 'Visualize My Home'}
                </button>
                {generationProgress.active && (
                    <div className="text-center mt-4">
                        <p className="text-sm text-slate-300 mb-2">{generationProgress.message}</p>
                        <div className="w-full bg-slate-700 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${generationProgress.percentage}%`, transition: 'width 0.3s ease-in-out' }}></div></div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

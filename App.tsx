/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import Header from './components/Header';
import StartScreen from './components/StartScreen';
import Spinner from './components/Spinner';
import AdjustmentPanel from './components/AdjustmentPanel';
import LifestylePanel from './components/LifestylePanel';
import TextPanel from './components/TextPanel';
import RatioPanel from './components/RatioPanel';
import ComponentPanel from './components/ComponentPanel';
import InteractiveText, { ActiveText, ComponentLayer } from './components/InteractiveText';
import InteractiveComponent from './components/InteractiveComponent';
import { generateAdjustedImage, suggestTextForImage } from './services/geminiService';
import { UndoIcon, RedoIcon, SunIcon, StorefrontIcon, TextIcon, AspectRatioIcon, DownloadIcon, LayersIcon } from './components/icons';

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

type Tool = 'ratio' | 'component' | 'lifestyle' | 'text' | 'adjustment';

const toolConfig: Record<Tool, { name: string, icon: JSX.Element }> = {
    ratio: { name: 'Ratio', icon: <AspectRatioIcon className="w-5 h-5 mr-3" /> },
    component: { name: 'Add Component', icon: <LayersIcon className="w-5 h-5 mr-3" /> },
    lifestyle: { name: 'Lifestyle', icon: <StorefrontIcon className="w-5 h-5 mr-3" /> },
    text: { name: 'Add Text', icon: <TextIcon className="w-5 h-5 mr-3" /> },
    adjustment: { name: 'Adjustments', icon: <SunIcon className="w-5 h-5 mr-3" /> },
};


const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTool, setActiveTool] = useState<Tool>('ratio');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  // Text tool state
  const [activeText, setActiveText] = useState<ActiveText | null>(null);
  const [textSuggestions, setTextSuggestions] = useState<string[]>([]);
  const [isSuggestingText, setIsSuggestingText] = useState(false);

  // Component tool state
  const [componentLayers, setComponentLayers] = useState<ComponentLayer[]>([]);
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);


  const displayedImage = history[historyIndex] || null;
  const activeComponent = componentLayers.find(c => c.id === activeComponentId);

  const handleReset = () => {
    setOriginalImage(null);
    setHistory([]);
    setHistoryIndex(-1);
    setActiveTool('ratio');
    setIsLoading(false);
    setError(null);
    setActiveText(null);
    setTextSuggestions([]);
    setIsSuggestingText(false);
    setComponentLayers([]);
    setActiveComponentId(null);
  };

  const pushToHistory = (imageDataUrl: string) => {
    setError(null);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageDataUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setOriginalImage(file);
      setIsLoading(true);
      setError(null);
      try {
        const dataUrl = await fileToDataUrl(file);
        setHistory([dataUrl]);
        setHistoryIndex(0);
        setActiveTool('ratio');
        setActiveText(null);
        setTextSuggestions([]);
        setComponentLayers([]);
        setActiveComponentId(null);
      } catch (err) {
        setError('Could not load image file.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setActiveText(null);
      setComponentLayers([]);
      setActiveComponentId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setActiveText(null);
      setComponentLayers([]);
      setActiveComponentId(null);
    }
  };

  const handleDownload = () => {
    if (!displayedImage) return;
    const link = document.createElement('a');
    link.href = displayedImage;
    const originalName = originalImage?.name.split('.').slice(0, -1).join('.') || 'image';
    link.download = `${originalName}-editphoto-edited.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyAdjustment = async (prompt: string) => {
    if (!originalImage) return;
    setIsLoading(true);
    setError(null);
    try {
      const adjustedImageUrl = await generateAdjustedImage(originalImage, prompt);
      pushToHistory(adjustedImageUrl);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while applying the adjustment.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRatio = (aspectRatio: number | null) => {
    if (!displayedImage || aspectRatio === null) return;
    
    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.onload = () => {
        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        const originalAspectRatio = originalWidth / originalHeight;

        let newWidth: number, newHeight: number;

        if (aspectRatio > originalAspectRatio) {
            newHeight = originalHeight;
            newWidth = newHeight * aspectRatio;
        } else {
            newWidth = originalWidth;
            newHeight = newWidth / aspectRatio;
        }
        
        newWidth = Math.round(newWidth);
        newHeight = Math.round(newHeight);

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setError('Could not create canvas context.');
            setIsLoading(false);
            return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newWidth, newHeight);

        const x = (newWidth - originalWidth) / 2;
        const y = (newHeight - originalHeight) / 2;
        ctx.drawImage(img, x, y);

        const newImageDataUrl = canvas.toDataURL('image/png');
        pushToHistory(newImageDataUrl);
        setIsLoading(false);
    };
    img.onerror = () => {
        setError('Could not load current image for processing.');
        setIsLoading(false);
    };
    img.src = displayedImage;
  };

  const getRenderedImageGeometry = (imageElement: HTMLImageElement | null) => {
      if (!imageElement) return null;
      const { naturalWidth, naturalHeight, clientWidth, clientHeight } = imageElement;
      const naturalAspectRatio = naturalWidth / naturalHeight;
      const clientAspectRatio = clientWidth / clientHeight;
      let renderedWidth, renderedHeight, offsetX, offsetY;

      if (naturalAspectRatio > clientAspectRatio) {
          renderedWidth = clientWidth;
          renderedHeight = clientWidth / naturalAspectRatio;
          offsetX = 0;
          offsetY = (clientHeight - renderedHeight) / 2;
      } else {
          renderedHeight = clientHeight;
          renderedWidth = clientHeight * naturalAspectRatio;
          offsetY = 0;
          offsetX = (clientWidth - renderedWidth) / 2;
      }
      const scale = naturalWidth / renderedWidth;
      return { renderedWidth, renderedHeight, offsetX, offsetY, scale };
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeTool !== 'text' || !imageRef.current || activeText) return;
      
      const geometry = getRenderedImageGeometry(imageRef.current);
      if (!geometry) return;

      const containerRect = e.currentTarget.getBoundingClientRect();
      const displayX = e.clientX - containerRect.left;
      const displayY = e.clientY - containerRect.top;

      const imageRelativeX = displayX - geometry.offsetX;
      const imageRelativeY = displayY - geometry.offsetY;

      if (imageRelativeX < 0 || imageRelativeX > geometry.renderedWidth || imageRelativeY < 0 || imageRelativeY > geometry.renderedHeight) {
          return; // Click was outside the actual image
      }

      setActiveText({
          text: 'Your Text Here',
          fontFamily: 'Roboto',
          fontSize: 50,
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#FFFFFF',
          displayX,
          displayY,
          x: imageRelativeX * geometry.scale,
          y: imageRelativeY * geometry.scale,
      });
  };

  const handleAddText = () => {
      if (!displayedImage || !activeText || !imageRef.current) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          
          const geometry = getRenderedImageGeometry(imageRef.current!);
          if (!geometry) return;

          const fontScale = geometry.scale;

          ctx.fillStyle = activeText.color;
          ctx.font = `${activeText.fontStyle} ${activeText.fontWeight} ${activeText.fontSize * fontScale}px "${activeText.fontFamily}"`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.fillText(activeText.text, activeText.x, activeText.y);

          const newImageDataUrl = canvas.toDataURL('image/png');
          pushToHistory(newImageDataUrl);
          setActiveText(null);
      };
      img.src = displayedImage;
  };
  
  const handleSuggestText = async () => {
    if (!originalImage) return;
    setIsSuggestingText(true);
    setTextSuggestions([]);
    try {
      const suggestions = await suggestTextForImage(originalImage);
      setTextSuggestions(suggestions);
    } catch (err: any) {
      setError(err.message || 'Failed to get AI suggestions.');
    } finally {
      setIsSuggestingText(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (!imageRef.current) return;

    if (activeText) {
      setActiveText({ ...activeText, text: suggestion });
    } else {
      const geometry = getRenderedImageGeometry(imageRef.current);
      if (!geometry) return;

      const centerX = geometry.offsetX + geometry.renderedWidth / 2;
      const centerY = geometry.offsetY + geometry.renderedHeight / 2;

      setActiveText({
        text: suggestion,
        fontFamily: 'Roboto',
        fontSize: 60,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#FFFFFF',
        displayX: centerX,
        displayY: centerY,
        x: (centerX - geometry.offsetX) * geometry.scale,
        y: (centerY - geometry.offsetY) * geometry.scale,
      });
    }
    setTextSuggestions([]);
  };

  const handleApplyLifestyleImage = (imageDataUrl: string) => {
      pushToHistory(imageDataUrl);
  };

  const handleComponentUpload = async (file: File) => {
    try {
        const dataUrl = await fileToDataUrl(file);
        const newComponent: ComponentLayer = {
            id: `comp_${Date.now()}`,
            src: dataUrl,
            originalFile: file,
            x: 0.5,
            y: 0.5,
            scale: 0.5,
            rotation: 0,
            flipH: false,
            flipV: false,
        };
        setComponentLayers(prev => [...prev, newComponent]);
        setActiveComponentId(newComponent.id);
    } catch (err) {
        setError('Could not load component image file.');
        console.error(err);
    }
  };
  
  const handleComponentUpdate = (updatedLayer: ComponentLayer) => {
    setComponentLayers(prev => prev.map(c => c.id === updatedLayer.id ? updatedLayer : c));
  };

  const handleDeleteComponent = () => {
    if (!activeComponentId) return;
    setComponentLayers(prev => prev.filter(c => c.id !== activeComponentId));
    setActiveComponentId(null);
  };


  const handleMergeComponent = () => {
    if (!displayedImage || !activeComponent || !imageRef.current) return;
    
    setIsLoading(true);
    const baseImage = new Image();
    const componentImage = new Image();

    const loadImages = Promise.all([
        new Promise<void>(res => { baseImage.onload = () => res(); baseImage.src = displayedImage; }),
        new Promise<void>(res => { componentImage.onload = () => res(); componentImage.src = activeComponent.src; })
    ]);

    loadImages.then(() => {
        const canvas = document.createElement('canvas');
        canvas.width = baseImage.naturalWidth;
        canvas.height = baseImage.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('Could not create canvas context.');
            setIsLoading(false);
            return;
        }

        // 1. Draw base image
        ctx.drawImage(baseImage, 0, 0);

        // 2. Calculate component transformations
        const centerX = activeComponent.x * baseImage.naturalWidth;
        const centerY = activeComponent.y * baseImage.naturalHeight;
        
        // Adjust scale to be relative to the base image size
        const componentAspectRatio = componentImage.naturalWidth / componentImage.naturalHeight;
        const baseWidthReference = baseImage.naturalWidth;
        const scaledWidth = baseWidthReference * activeComponent.scale;
        
        const drawWidth = scaledWidth;
        const drawHeight = scaledWidth / componentAspectRatio;

        // 3. Apply transformations and draw component
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(activeComponent.rotation * Math.PI / 180);
        ctx.scale(activeComponent.flipH ? -1 : 1, activeComponent.flipV ? -1 : 1);
        ctx.drawImage(componentImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();

        const newImageDataUrl = canvas.toDataURL('image/png');
        pushToHistory(newImageDataUrl);
        handleDeleteComponent(); // Remove merged component
        setIsLoading(false);
    }).catch(err => {
        setError('Failed to load images for merging.');
        console.error(err);
        setIsLoading(false);
    });
  };

  
  const renderToolPanel = () => {
    if (!originalImage) return null;
    switch (activeTool) {
      case 'ratio':
        return <RatioPanel onApplyRatio={handleApplyRatio} isLoading={isLoading} />;
      case 'component':
        return <ComponentPanel 
          activeComponent={activeComponent}
          onComponentChange={handleComponentUpdate}
          onUpload={handleComponentUpload}
          onDelete={handleDeleteComponent}
          onMerge={handleMergeComponent}
          isLoading={isLoading}
        />;
      case 'lifestyle':
        return <LifestylePanel originalImage={originalImage} onApplyLifestyleImage={handleApplyLifestyleImage} isLoading={isLoading} />;
      case 'text':
        return <TextPanel
            options={activeText}
            onOptionsChange={setActiveText}
            onApplyText={handleAddText}
            isLoading={isLoading}
            onSuggestText={handleSuggestText}
            suggestions={textSuggestions}
            isSuggesting={isSuggestingText}
            onSelectSuggestion={handleSelectSuggestion}
          />;
      case 'adjustment':
        return <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} />;
      default:
        return <div className="text-gray-500 p-4">Select a tool to begin editing.</div>;
    }
  };

  const switchTool = (tool: Tool) => {
    setActiveTool(tool);
    // Reset transient states when switching tools
    setActiveText(null);
    setActiveComponentId(null);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header onReset={handleReset} />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        {!originalImage || !displayedImage ? (
          <StartScreen onFileSelect={handleFileSelect} />
        ) : (
          <div className="w-full h-full flex flex-col lg:flex-row gap-8 animate-fade-in">
            {/* Left Panel: Toolbar & History */}
            <div className="flex flex-col gap-4 w-full lg:w-72 flex-shrink-0">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 flex flex-row lg:flex-col gap-2 backdrop-blur-sm">
                 {(Object.keys(toolConfig) as Tool[]).map(tool => (
                     <button
                        key={tool}
                        onClick={() => switchTool(tool)}
                        className={`w-full flex items-center p-3 rounded-md transition-colors text-base font-semibold ${activeTool === tool ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-gray-300'}`}
                     >
                        {toolConfig[tool].icon}
                        {toolConfig[tool].name}
                     </button>
                 ))}
              </div>
              <div className="flex items-center justify-center gap-4 p-2 bg-gray-800/50 border border-gray-700 rounded-lg backdrop-blur-sm">
                <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" title="Undo">
                    <UndoIcon className="w-6 h-6" />
                </button>
                <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" title="Redo">
                    <RedoIcon className="w-6 h-6" />
                </button>
                <div className="border-l border-gray-600 h-6 mx-2"></div>
                <button onClick={handleDownload} disabled={!displayedImage} className="p-2 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" title="Download Image">
                    <DownloadIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Center Panel: Image Canvas */}
            <div className="flex-grow flex items-center justify-center bg-black/20 rounded-lg overflow-hidden border border-gray-700/50 min-h-[50vh] relative" onClick={handleImageClick}>
              {isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4 z-20 backdrop-blur-sm">
                    <Spinner />
                    <p className="text-gray-300 font-semibold text-lg">
                      AI is working its magic...
                    </p>
                  </div>
              )}
               <img ref={imageRef} src={displayedImage} alt="Editable content" className="max-w-full max-h-[80vh] object-contain" />
               {activeTool === 'text' && activeText && imageRef.current && (
                  <InteractiveText textData={activeText} onUpdate={setActiveText} imageRef={imageRef.current} />
               )}
               {activeTool === 'component' && imageRef.current && componentLayers.map(layer => (
                  <InteractiveComponent
                    key={layer.id}
                    data={layer}
                    onUpdate={handleComponentUpdate}
                    imageRef={imageRef.current}
                    isActive={layer.id === activeComponentId}
                    onSelect={() => setActiveComponentId(layer.id)}
                  />
               ))}
            </div>

            {/* Right Panel: Tool Options */}
            <div className="w-full lg:w-[450px] flex-shrink-0 flex flex-col">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-4 text-sm animate-fade-in" role="alert">
                  <div className="flex">
                    <div className="py-1"><svg className="fill-current h-6 w-6 text-red-400 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM11.414 10l2.829-2.828a1 1 0 1 0-1.414-1.414L10 8.586 7.172 5.757a1 1 0 0 0-1.414 1.414L8.586 10l-2.829 2.828a1 1 0 1 0 1.414 1.414L10 11.414l2.829 2.828a1 1 0 0 0 1.414-1.414L11.414 10z"/></svg></div>
                    <div>
                      <p className="font-bold">An error occurred</p>
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex-grow">
                {renderToolPanel()}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
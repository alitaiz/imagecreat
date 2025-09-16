/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { UploadIcon, TrashIcon } from './icons';
// FIX: ComponentLayer is exported from 'InteractiveText', not 'InteractiveComponent'.
import type { ComponentLayer } from './InteractiveText';

interface ComponentPanelProps {
  activeComponent: ComponentLayer | null;
  onComponentChange: (layer: ComponentLayer) => void;
  onUpload: (file: File) => void;
  onDelete: () => void;
  onMerge: () => void;
  isLoading: boolean;
}

const ComponentPanel: React.FC<ComponentPanelProps> = ({
  activeComponent,
  onComponentChange,
  onUpload,
  onDelete,
  onMerge,
  isLoading,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
      e.target.value = ''; // Reset file input
    }
  };

  const handleTransformChange = <K extends keyof ComponentLayer>(
    key: K,
    value: ComponentLayer[K]
  ) => {
    if (activeComponent) {
      onComponentChange({ ...activeComponent, [key]: value });
    }
  };

  return (
    <div className="w-full h-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
        <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-300">Component Layers</h3>
            <p className="text-sm text-gray-400 -mt-1">Add images as layers, then select to edit.</p>
        </div>

        <label htmlFor="component-upload" className="relative w-full inline-flex items-center justify-center px-4 py-3 text-base font-bold text-white bg-blue-600/80 rounded-lg cursor-pointer group hover:bg-blue-600 transition-colors disabled:opacity-50">
            <UploadIcon className="w-5 h-5 mr-3" />
            Add New Component
        </label>
        <input id="component-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
        
        {activeComponent ? (
            <div className="flex flex-col gap-4 pt-4 border-t border-gray-700 animate-fade-in">
                <h4 className="text-base font-semibold text-center text-gray-300">Edit Selected Component</h4>
                
                <div className="flex flex-col gap-3 p-3 bg-gray-900/50 rounded-md border border-gray-700">
                    <h4 className="text-sm font-medium text-gray-400">Transform</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Scale */}
                        <div className="flex flex-col gap-1">
                            <label htmlFor="comp-scale" className="text-xs text-gray-500">Scale</label>
                            <input
                                id="comp-scale"
                                type="range"
                                min="0.05"
                                max="3"
                                step="0.01"
                                value={activeComponent.scale}
                                onChange={(e) => handleTransformChange('scale', parseFloat(e.target.value))}
                                disabled={isLoading}
                                className="w-full"
                            />
                        </div>
                        {/* Rotation */}
                        <div className="flex flex-col gap-1">
                            <label htmlFor="comp-rotation" className="text-xs text-gray-500">Rotation</label>
                            <input
                                id="comp-rotation"
                                type="range"
                                min="0"
                                max="360"
                                step="1"
                                value={activeComponent.rotation}
                                onChange={(e) => handleTransformChange('rotation', parseInt(e.target.value, 10))}
                                disabled={isLoading}
                                className="w-full"
                            />
                        </div>
                        {/* Flip */}
                        <div className="col-span-2 flex gap-2">
                            <button
                                onClick={() => handleTransformChange('flipH', !activeComponent.flipH)}
                                disabled={isLoading}
                                className="w-full bg-white/10 text-gray-200 p-2 rounded-md text-sm transition hover:bg-white/20"
                            >
                                Flip Horizontal
                            </button>
                            <button
                                onClick={() => handleTransformChange('flipV', !activeComponent.flipV)}
                                disabled={isLoading}
                                className="w-full bg-white/10 text-gray-200 p-2 rounded-md text-sm transition hover:bg-white/20"
                            >
                                Flip Vertical
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                    <button
                        onClick={onDelete}
                        disabled={isLoading}
                        title="Delete Component"
                        className="p-4 rounded-lg transition-colors bg-red-600/80 hover:bg-red-600 disabled:bg-red-900 disabled:cursor-not-allowed"
                    >
                        <TrashIcon className="w-6 h-6 text-white" />
                    </button>
                    <button
                        onClick={onMerge}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-green-800 disabled:to-green-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                    >
                        Apply to Image
                    </button>
                </div>

            </div>
        ) : (
            <div className="text-center text-gray-400 p-4 bg-black/20 rounded-lg mt-2 flex-grow flex items-center justify-center">
              <p>Click a component on the image to select it for editing.</p>
            </div>
        )}
    </div>
  );
};

export default ComponentPanel;
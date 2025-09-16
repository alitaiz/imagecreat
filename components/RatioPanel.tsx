/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface RatioPanelProps {
  onApplyRatio: (aspectRatio: number | null) => void;
  isLoading: boolean;
}

type AspectRatioPreset = '1:1' | '16:9' | '9:16' | 'custom';

const presets: { name: AspectRatioPreset; value: number | null }[] = [
  { name: '1:1', value: 1 },
  { name: '16:9', value: 16 / 9 },
  { name: '9:16', value: 9 / 16 },
];

const RatioPanel: React.FC<RatioPanelProps> = ({ onApplyRatio, isLoading }) => {
    const [activePreset, setActivePreset] = useState<AspectRatioPreset | null>(null);
    const [customWidth, setCustomWidth] = useState<number>(16);
    const [customHeight, setCustomHeight] = useState<number>(9);

    const handleApply = () => {
        if (activePreset === 'custom') {
            if (customWidth > 0 && customHeight > 0) {
                onApplyRatio(customWidth / customHeight);
            }
        } else {
            const selectedPreset = presets.find(p => p.name === activePreset);
            if (selectedPreset) {
                onApplyRatio(selectedPreset.value);
            }
        }
    };

    const isApplyDisabled = isLoading || !activePreset || (activePreset === 'custom' && (!customWidth || !customHeight || customWidth <= 0 || customHeight <= 0));

    return (
        <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-center text-gray-300">Change Canvas Ratio</h3>
            <p className="text-sm text-gray-400 text-center -mt-2">Expand the canvas to fit a new aspect ratio. The new area will be filled with white.</p>

            <div className="grid grid-cols-3 gap-2">
                {presets.map(preset => (
                    <button
                        key={preset.name}
                        onClick={() => setActivePreset(preset.name)}
                        disabled={isLoading}
                        className={`w-full text-center bg-white/10 border border-transparent text-gray-200 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed ${activePreset === preset.name ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-500' : ''}`}
                    >
                        {preset.name}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-2 p-3 bg-gray-900/50 rounded-md border border-gray-700">
                <button
                    onClick={() => setActivePreset('custom')}
                    className={`w-full text-left p-2 rounded-md transition-colors ${activePreset === 'custom' ? 'bg-blue-600/30' : 'bg-transparent'}`}
                >
                    <span className="text-base font-semibold text-gray-200">Custom Ratio</span>
                </button>
                <div className={`flex items-center gap-4 transition-opacity ${activePreset === 'custom' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(parseInt(e.target.value, 10) || 0)}
                        placeholder="W"
                        className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-2 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isLoading || activePreset !== 'custom'}
                        min="1"
                    />
                    <span className="text-xl font-bold text-gray-500">:</span>
                    <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(parseInt(e.target.value, 10) || 0)}
                        placeholder="H"
                        className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-2 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isLoading || activePreset !== 'custom'}
                        min="1"
                    />
                </div>
            </div>

            <button
                onClick={handleApply}
                className="w-full mt-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                disabled={isApplyDisabled}
            >
                Apply Ratio
            </button>
        </div>
    );
};

export default RatioPanel;

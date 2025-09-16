/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import type { ActiveText } from './InteractiveText';
import { SparklesIcon } from './icons';

export type TextOptions = Omit<ActiveText, 'displayX' | 'displayY' | 'x' | 'y'>;

interface TextPanelProps {
  options: ActiveText | null;
  onOptionsChange: (newOptions: ActiveText | null) => void;
  onApplyText: () => void;
  isLoading: boolean;
  onSuggestText: () => void;
  suggestions: string[];
  isSuggesting: boolean;
  onSelectSuggestion: (text: string) => void;
}

const fonts = [
  'Abel', 'Alfa Slab One', 'Alegreya', 'Amatic SC', 'Anton', 'Architects Daughter', 'Archivo', 'Arvo', 'Bad Script', 'Bangers', 'Barlow', 'Bebas Neue', 'Bitter', 'Black Ops One', 'Bungee', 'Bungee Shade', 'Cabin', 'Calligraffitti', 'Cardo', 'Caveat', 'Cedarville Cursive', 'Cinzel', 'Comfortaa', 'Comic Neue', 'Cormorant Garamond', 'Cousine', 'Covered By Your Grace', 'Crimson Text', 'DM Sans', 'Dancing Script', 'Domine', 'Dosis', 'EB Garamond', 'Exo 2', 'Fira Code', 'Fjalla One', 'Fredoka', 'Fredericka the Great', 'Gochi Hand', 'Great Vibes', 'Homemade Apple', 'Indie Flower', 'Inconsolata', 'Inter', 'Josefin Sans', 'Just Me Again Down Here', 'Kalam', 'Kanit', 'Lato', 'Lobster', 'Lobster Two', 'Lora', 'Luckiest Guy', 'Maven Pro', 'Merriweather', 'Monoton', 'Montserrat', 'Nanum Gothic Coding', 'Noto Sans', 'Nunito', 'Old Standard TT', 'Open Sans', 'Orbitron', 'Oswald', 'Pacifico', 'Passion One', 'Patrick Hand', 'Permanent Marker', 'Playfair Display', 'Poppins', 'Prata', 'Press Start 2P', 'Quattrocento', 'Quicksand', 'Raleway', 'Righteous', 'Roboto', 'Rock Salt', 'Rubik', 'Rye', 'Sacramento', 'Satisfy', 'Shadows Into Light', 'Signika Negative', 'Source Code Pro', 'Source Serif 4', 'Space Mono', 'Special Elite', 'Teko', 'Tinos', 'Ubuntu', 'Uncial Antiqua', 'Vollkorn', 'Wallpoet', 'Work Sans', 'Yatra One'
];

const TextPanel: React.FC<TextPanelProps> = ({ options, onOptionsChange, onApplyText, isLoading, onSuggestText, suggestions, isSuggesting, onSelectSuggestion }) => {
  
  const handleOptionChange = <K extends keyof TextOptions>(key: K, value: TextOptions[K]) => {
    if (options) {
      onOptionsChange({ ...options, [key]: value });
    }
  };

  const isTextActive = !!options;
  
  const handleSuggestionClick = (suggestion: string) => {
    onSelectSuggestion(suggestion);
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-300">Add Text to Image</h3>
        <p className="text-sm text-gray-400 -mt-1">
          {isTextActive ? 'Drag text to move, use handles to resize, or edit styles below.' : 'Click on the image to place text, or use AI to suggest content.'}
        </p>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <textarea
            value={options?.text ?? ''}
            onChange={(e) => handleOptionChange('text', e.target.value)}
            placeholder={isTextActive ? "Type your text here..." : "Click image or use AI suggestions"}
            className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-base disabled:cursor-not-allowed disabled:opacity-60"
            rows={2}
            disabled={isLoading || !isTextActive}
          />
          <button
            onClick={onSuggestText}
            disabled={isLoading || isSuggesting}
            className="flex-shrink-0 flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-gray-200 font-semibold p-3 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            title="Suggest text with AI"
          >
            <SparklesIcon className={`w-5 h-5 ${isSuggesting ? 'animate-pulse' : ''}`}/>
            {isSuggesting ? 'Thinking...' : 'Suggest'}
          </button>
        </div>
        
        {suggestions.length > 0 && (
          <div className="animate-fade-in flex flex-col gap-2 p-3 bg-gray-900/50 rounded-md border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300">AI Suggestions:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="bg-blue-500/20 text-blue-200 hover:bg-blue-500/40 px-3 py-1.5 text-sm rounded-md transition-colors"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${isTextActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          {/* Font Family */}
          <div className="flex flex-col gap-1">
            <label htmlFor="fontFamily" className="text-sm font-medium text-gray-400">Font</label>
            <select
              id="fontFamily"
              value={options?.fontFamily ?? 'Roboto'}
              onChange={(e) => handleOptionChange('fontFamily', e.target.value)}
              disabled={isLoading || !isTextActive}
              className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:opacity-60"
            >
              {fonts.sort().map(font => <option key={font} value={font} style={{fontFamily: font}}>{font}</option>)}
            </select>
          </div>
          
          {/* Font Size & Color */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-400">Size & Color</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={options?.fontSize ?? 50}
                onChange={(e) => handleOptionChange('fontSize', parseInt(e.target.value, 10) || 12)}
                disabled={isLoading || !isTextActive}
                className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:opacity-60"
                min="1"
              />
               <input
                type="color"
                value={options?.color ?? '#FFFFFF'}
                onChange={(e) => handleOptionChange('color', e.target.value)}
                disabled={isLoading || !isTextActive}
                className="w-16 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer disabled:opacity-60"
                title="Select text color"
              />
            </div>
          </div>
          
          {/* Font Weight */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-400">Weight</label>
            <div className="flex gap-2">
              {(['normal', 'bold'] as const).map(weight => (
                <button
                  key={weight}
                  onClick={() => handleOptionChange('fontWeight', weight)}
                  disabled={isLoading || !isTextActive}
                  className={`w-full capitalize p-2 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                    options?.fontWeight === weight
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-gray-200'
                  }`}
                >
                  {weight}
                </button>
              ))}
            </div>
          </div>
          
          {/* Font Style */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-400">Style</label>
            <div className="flex gap-2">
              {(['normal', 'italic'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => handleOptionChange('fontStyle', style)}
                  disabled={isLoading || !isTextActive}
                  className={`w-full capitalize p-2 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                    options?.fontStyle === style
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-gray-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={onApplyText}
        disabled={isLoading || !isTextActive || !options?.text.trim()}
        className="w-full mt-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        Add Text to Image
      </button>
    </div>
  );
};

export default TextPanel;
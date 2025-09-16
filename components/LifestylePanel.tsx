/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { analyzeProductForLifestyleIdeas, createImagePromptFromIdea, generateLifestyleImage } from '../services/geminiService';
import Spinner from './Spinner';
import { LightBulbIcon } from './icons';

interface LifestylePanelProps {
  originalImage: File;
  onApplyLifestyleImage: (imageDataUrl: string) => void;
  isLoading: boolean; // Global loading state from App
}

interface AnalysisResult {
    description: string;
    ideas: string[];
}

const LifestylePanel: React.FC<LifestylePanelProps> = ({ originalImage, onApplyLifestyleImage, isLoading }) => {
  const [productInfo, setProductInfo] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [detailedPrompt, setDetailedPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetIdeas = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setDetailedPrompt('');
    try {
      const result = await analyzeProductForLifestyleIdeas(originalImage, productInfo);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Failed to get ideas from AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectIdea = async (idea: string) => {
    if (!analysis) return;
    setIsGeneratingPrompt(true);
    setError(null);
    try {
        const prompt = await createImagePromptFromIdea(analysis.description, idea);
        setDetailedPrompt(prompt);
    } catch (err: any) {
        setError(err.message || 'Failed to generate a detailed prompt.');
    } finally {
        setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!detailedPrompt) return;
    setIsGeneratingImage(true);
    setError(null);
    try {
        const newImage = await generateLifestyleImage(originalImage, detailedPrompt);
        onApplyLifestyleImage(newImage);
    } catch (err: any) {
        setError(err.message || 'Failed to generate the lifestyle image.');
    } finally {
        setIsGeneratingImage(false);
    }
  };
  
  const anyProcessRunning = isLoading || isAnalyzing || isGeneratingPrompt || isGeneratingImage;

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-300">Generate Lifestyle Photo</h3>
        <p className="text-sm text-gray-400 -mt-1">Place your product in a new scene.</p>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md text-sm animate-fade-in">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step 1: Get Ideas */}
      <div className="flex flex-col gap-2 p-3 bg-gray-900/50 rounded-md border border-gray-700">
        <label htmlFor="productInfo" className="text-sm font-medium text-gray-400">
          1. Tell us about the product (optional)
        </label>
        <input
          id="productInfo"
          type="text"
          value={productInfo}
          onChange={(e) => setProductInfo(e.target.value)}
          placeholder="e.g., 'A handmade leather wallet for men'"
          className="bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
          disabled={anyProcessRunning}
        />
        <button
          onClick={handleGetIdeas}
          disabled={anyProcessRunning}
          className="w-full mt-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
          {isAnalyzing ? <Spinner /> : <><LightBulbIcon className="w-5 h-5 inline-block mr-2" /> Get Scene Ideas</>}
        </button>
      </div>

      {/* Step 2: Choose Idea */}
      {(isAnalyzing || analysis) && (
          <div className="flex flex-col gap-3 p-3 bg-gray-900/50 rounded-md border border-gray-700 animate-fade-in">
            <h4 className="text-sm font-medium text-gray-400">2. Choose a creative concept</h4>
            {isAnalyzing && <div className="text-sm text-gray-400">Analyzing image...</div>}
            {analysis && (
              <>
                <p className="text-sm italic text-gray-500 bg-black/20 p-2 rounded"><strong>Analyzed:</strong> {analysis.description}</p>
                <div className="flex flex-col gap-2">
                    {analysis.ideas.map((idea, index) => (
                        <button key={index} onClick={() => handleSelectIdea(idea)} disabled={anyProcessRunning} className="text-left text-sm bg-white/5 hover:bg-white/10 p-3 rounded-md transition-colors disabled:opacity-50">
                            "{idea}"
                        </button>
                    ))}
                </div>
              </>
            )}
          </div>
      )}

      {/* Step 3: Generate Image */}
      {(isGeneratingPrompt || detailedPrompt) && (
        <div className="flex flex-col gap-2 p-3 bg-gray-900/50 rounded-md border border-gray-700 animate-fade-in">
          <label htmlFor="detailedPrompt" className="text-sm font-medium text-gray-400">
            3. Review prompt and generate
          </label>
           <textarea
              id="detailedPrompt"
              value={detailedPrompt}
              onChange={(e) => setDetailedPrompt(e.target.value)}
              placeholder={isGeneratingPrompt ? "Generating prompt..." : "Detailed prompt will appear here..."}
              className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-base disabled:cursor-not-allowed disabled:opacity-60"
              rows={5}
              disabled={anyProcessRunning || isGeneratingPrompt}
            />
          <button
            onClick={handleGenerateImage}
            disabled={anyProcessRunning || !detailedPrompt.trim()}
            className="w-full mt-2 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-green-800 disabled:to-green-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGeneratingImage ? <Spinner /> : "Generate Image"}
          </button>
        </div>
      )}
    </div>
  );
};

export default LifestylePanel;

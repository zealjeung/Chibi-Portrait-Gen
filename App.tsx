import React, { useState, useCallback } from 'react';
import { Sparkles, Download, Share2, Wand2 } from 'lucide-react';
import { InputArea } from './components/InputArea';
import { ImageDisplay } from './components/ImageDisplay';
import { RefinementBox } from './components/RefinementBox';
import { generateChibi, refineChibi } from './services/geminiService';
import { GenerationState } from './types';

export default function App() {
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: 'idle',
    imageUrl: null,
    prompt: '',
    effectivePrompt: '',
    error: null,
  });

  const handleGenerate = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;

    setGenerationState(prev => ({ 
      ...prev, 
      status: 'loading', 
      prompt: userInput, 
      error: null,
      referenceData: undefined
    }));

    try {
      const result = await generateChibi(userInput);
      setGenerationState({
        status: 'success',
        imageUrl: result.imageUrl,
        prompt: userInput,
        effectivePrompt: result.effectivePrompt,
        referenceData: result.referenceData,
        error: null
      });
    } catch (err) {
      console.error(err);
      setGenerationState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to generate image. Please try again.'
      }));
    }
  }, []);

  const handleRefine = useCallback(async (adjustment: string) => {
    // Check for imageUrl because refinement is now Image-to-Image
    if (!generationState.imageUrl) return;

    setGenerationState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const result = await refineChibi(generationState.imageUrl, adjustment);
      setGenerationState(prev => ({
        ...prev,
        status: 'success',
        imageUrl: result.imageUrl,
        effectivePrompt: result.effectivePrompt,
        // Keep the old reference data if available, as refinement doesn't re-fetch it
        referenceData: prev.referenceData,
        error: null
      }));
    } catch (err) {
      console.error(err);
      setGenerationState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to update image. Please try again.'
      }));
    }
  }, [generationState.imageUrl]);

  const handleDownload = useCallback(() => {
    if (generationState.imageUrl) {
      const link = document.createElement('a');
      link.href = generationState.imageUrl;
      link.download = `chibi-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [generationState.imageUrl]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Header */}
      <header className="mb-8 text-center z-10">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-lg mb-4 animate-bounce-slow">
          <Sparkles className="w-8 h-8 text-primary fill-current" />
        </div>
        <h1 className="text-5xl font-display font-bold text-dark mb-2 tracking-tight">
          <span className="text-primary">Chibi</span>Gen AI
        </h1>
        <p className="text-lg text-gray-600 font-medium max-w-md mx-auto">
          Turn any character into a cute, whole-body chibi with a magic background!
        </p>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden flex flex-col z-10 transition-all duration-300 hover:shadow-primary/10">
        
        {/* Image Display Area */}
        <div className="p-6 pb-2 flex-grow flex flex-col items-center justify-center min-h-[400px]">
          <ImageDisplay 
            state={generationState} 
          />
          
          {/* Refinement Box - Only visible when success */}
          {generationState.status === 'success' && (
            <RefinementBox 
              onRefine={handleRefine}
              isGenerating={generationState.status === 'loading'}
            />
          )}
        </div>

        {/* Action Bar (Download) */}
        {generationState.status === 'success' && (
          <div className="px-6 py-2 flex gap-3 justify-center">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary font-bold rounded-xl hover:bg-secondary/20 transition-colors"
            >
              <Download size={18} />
              Save Image
            </button>
          </div>
        )}

        {/* Input Area - Always visible for new chars */}
        <div className="p-6 bg-white/50 border-t border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider ml-1">
            {generationState.status === 'success' ? 'Or create a new character' : 'Start here'}
          </div>
          <InputArea 
            onGenerate={handleGenerate} 
            isGenerating={generationState.status === 'loading'} 
          />
        </div>
      </main>

      {/* Footer / Credits */}
      <footer className="mt-8 text-gray-400 text-sm font-medium z-10">
        Powered by Gemini & Imagen 3
      </footer>

      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -z-0"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl -z-0"></div>
    </div>
  );
}
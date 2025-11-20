import React, { useState } from 'react';
import { GenerationState } from '../types';
import { Image as ImageIcon, AlertCircle, Search, CheckCircle2, ExternalLink, Info } from 'lucide-react';

interface ImageDisplayProps {
  state: GenerationState;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ state }) => {
  const { status, imageUrl, error, referenceData, prompt } = state;
  const [imgError, setImgError] = useState(false);

  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(prompt)}`;

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center text-center animate-pulse w-full">
        <div className="w-32 h-32 bg-secondary/20 rounded-full mb-6 flex items-center justify-center relative">
          <div className="absolute inset-0 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
          <span className="text-4xl">✨</span>
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Dreaming up your Chibi...</h3>
        <p className="text-gray-500">Searching character lore & drawing</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 bg-red-50 rounded-2xl border border-red-100 w-full">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-red-800 mb-2">Oops! Magic failed</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (status === 'success' && imageUrl) {
    return (
      <div className="flex flex-col w-full space-y-4">
        {/* Main Result */}
        <div className="relative group w-full flex items-center justify-center bg-gray-50 rounded-2xl p-2 border border-gray-100">
          <img
            src={imageUrl}
            alt="Generated Chibi"
            className="max-w-full max-h-[450px] w-auto h-auto rounded-xl shadow-sm object-contain animate-[fadeIn_0.5s_ease-out]"
          />
        </div>

        {/* Reference & Debug Info Panel */}
        {referenceData && (
            <div className="w-full bg-blue-50/50 rounded-xl border border-blue-100 p-4 text-sm">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold uppercase tracking-wider text-xs">
                <Search size={14} />
                <span>Reference & Accuracy Check</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Detected Traits */}
                 <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-500" /> Detected Traits
                    </h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li><span className="font-medium text-gray-500">Hair:</span> {referenceData.traits.hair}</li>
                      <li><span className="font-medium text-gray-500">Eyes:</span> {referenceData.traits.eyes}</li>
                      <li><span className="font-medium text-gray-500">Outfit:</span> {referenceData.traits.outfit}</li>
                      <li><span className="font-medium text-gray-500">Features:</span> {referenceData.traits.distinctiveFeatures}</li>
                    </ul>
                 </div>

                 {/* Reference Image & Sources */}
                 <div className="flex flex-col gap-2">
                    <h4 className="font-semibold text-gray-700 text-xs mb-1">Reference Image</h4>
                    <div className="flex items-start gap-3">
                      {referenceData.referenceImageUrl && !imgError ? (
                        <a 
                          href={referenceData.referenceImageUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm group block flex-shrink-0 transition-transform hover:scale-105"
                        >
                          <img 
                            src={referenceData.referenceImageUrl} 
                            alt="Ref" 
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </a>
                      ) : (
                        <a 
                          href={googleImagesUrl}
                          target="_blank" 
                          rel="noreferrer"
                          className="w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center p-1 gap-1 hover:border-blue-400 hover:bg-blue-50 transition-all group cursor-pointer"
                        >
                           <Search size={18} className="text-gray-400 group-hover:text-blue-500" />
                           <span className="text-[9px] text-gray-500 font-bold leading-tight group-hover:text-blue-600">
                             Search<br/>Images
                           </span>
                        </a>
                      )}

                      {referenceData.sources.length > 0 && (
                        <div className="flex-grow">
                           <div className="flex flex-col gap-1.5">
                             {referenceData.sources.map((src, idx) => (
                               <a key={idx} href={src} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-[10px] flex items-center gap-1 truncate max-w-[150px]">
                                 <ExternalLink size={10} /> 
                                 <span className="truncate">Source {idx + 1}</span>
                               </a>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>
        )}
      </div>
    );
  }

  // Idle State
  return (
    <div className="flex flex-col items-center justify-center text-center text-gray-400">
      <div className="w-24 h-24 bg-gray-100 rounded-3xl rotate-3 mb-6 flex items-center justify-center shadow-inner">
        <ImageIcon size={40} className="text-gray-300" />
      </div>
      <h3 className="text-xl font-display font-bold text-gray-300 mb-1">Ready to Create</h3>
      <p className="text-sm max-w-[200px]">
        Enter a character name to generate a custom chibi sticker!
      </p>
    </div>
  );
};
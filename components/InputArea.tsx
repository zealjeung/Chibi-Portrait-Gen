import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

interface InputAreaProps {
  onGenerate: (text: string) => void;
  isGenerating: boolean;
}

// Add Web Speech API type definition shim
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isGenerating }) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const windowObj = window as unknown as IWindow;
    const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        // Optional: Auto-submit on voice end? Let's just fill the input for safety.
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;
    onGenerate(inputValue);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Name a character (e.g. 'Batman', 'Hatsune Miku')..."
            disabled={isGenerating}
            className="w-full pl-4 pr-12 py-4 bg-gray-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-secondary focus:ring-0 transition-all outline-none text-gray-700 font-medium placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={toggleListening}
            disabled={isGenerating}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${
              isListening 
                ? 'text-red-500 bg-red-100 animate-pulse' 
                : 'text-gray-400 hover:text-secondary hover:bg-secondary/10'
            }`}
            title="Dictate Character"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputValue.trim() || isGenerating}
          className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 hover:bg-red-500 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <Send size={24} className={isGenerating ? 'opacity-0' : 'ml-1'} />
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </button>
      </div>
      <p className="text-xs text-center mt-3 text-gray-400 font-medium">
        {isListening ? 'Listening...' : 'Type a name or click the mic to speak'}
      </p>
    </form>
  );
};
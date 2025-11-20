import React, { useState, useEffect, useRef } from 'react';
import { Wand2, Mic, MicOff, SendHorizontal } from 'lucide-react';

interface RefinementBoxProps {
  onRefine: (adjustment: string) => void;
  isGenerating: boolean;
}

// Web Speech API shim
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const RefinementBox: React.FC<RefinementBoxProps> = ({ onRefine, isGenerating }) => {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
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
        setValue(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported");
      return;
    }
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isGenerating) return;
    onRefine(value);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mt-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-primary rounded-xl opacity-30 group-hover:opacity-50 blur transition duration-200"></div>
        <div className="relative flex items-center bg-white rounded-xl shadow-sm">
          <div className="pl-3 text-gray-400">
            <Wand2 size={18} />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isGenerating}
            placeholder="Tell me what to change (e.g. 'add wings', 'make it night time')..."
            className="flex-grow py-3 px-3 bg-transparent outline-none text-gray-700 text-sm placeholder-gray-400 disabled:opacity-50"
          />
          <div className="flex items-center pr-2 gap-1">
            <button
              type="button"
              onClick={toggleListening}
              disabled={isGenerating}
              className={`p-2 rounded-lg transition-colors ${
                isListening ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              type="submit"
              disabled={!value.trim() || isGenerating}
              className="p-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SendHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
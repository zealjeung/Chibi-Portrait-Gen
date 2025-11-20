export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface CharacterTraits {
  species: string;
  hair: string;
  eyes: string;
  outfit: string;
  distinctiveFeatures: string;
}

export interface ReferenceData {
  traits: CharacterTraits;
  sources: string[];
  referenceImageUrl?: string;
}

export interface GenerationState {
  status: GenerationStatus;
  imageUrl: string | null;
  prompt: string; // User's original input
  effectivePrompt: string; // The actual detailed prompt used for generation
  referenceData?: ReferenceData; // New field for research data
  error: string | null;
}

export interface IconProps {
  className?: string;
  size?: number;
}
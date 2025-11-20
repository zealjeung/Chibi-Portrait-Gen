import { GoogleGenAI, Modality, Type } from "@google/genai";
import { CharacterTraits, ReferenceData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GenResult {
  imageUrl: string;
  effectivePrompt: string;
  referenceData: ReferenceData;
}

/**
 * Enhances the user's simple prompt into a detailed prompt for the image generator.
 * Uses Google Search to ensure character details (species, appearance) are accurate.
 * Returns structured data including traits and reference URL.
 */
async function enhancePrompt(userInput: string): Promise<{ prompt: string, referenceData: ReferenceData }> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Research the character or concept "${userInput}" using Google Search.
      
      Tasks:
      1. Find their official visual appearance (Hair, Eyes, Outfit, Key Accessories).
      2. LOCATE A REFERENCE IMAGE: Search for a direct URL to an image of this character (ideally ending in .jpg, .png, .webp) from a Wiki, Fandom, official site, or database.
      3. Write a detailed image generation prompt for a 'Chibi' version.
      
      CRITICAL PROMPT REQUIREMENTS:
      - Style: High-quality Chibi style. Maintain the ORIGINAL art style (e.g. 3D, pixel, watercolor) but with Chibi proportions.
      - Details: Be EXTREMELY ACCURATE with hair size, volume, and physics. If the character has huge hair, the chibi must have huge hair.
      - Subject: Whole body.
      
      Return the result in JSON format containing the prompt, the specific traits found, and the reference image URL.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            imagePrompt: { type: Type.STRING, description: "The detailed text prompt for the image generator" },
            traits: {
              type: Type.OBJECT,
              properties: {
                species: { type: Type.STRING },
                hair: { type: Type.STRING, description: "Detailed description of hair color, style, and volume" },
                eyes: { type: Type.STRING },
                outfit: { type: Type.STRING },
                distinctiveFeatures: { type: Type.STRING }
              },
              required: ["species", "hair", "eyes", "outfit", "distinctiveFeatures"]
            },
            referenceImageUrl: { type: Type.STRING, description: "A direct URL to an image of the character found in search results. If none found, leave empty." }
          },
          required: ["imagePrompt", "traits"]
        }
      }
    });
    
    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr);

    // Extract sources from grounding metadata if available
    const sources: string[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }

    // Deduplicate sources
    const uniqueSources = Array.from(new Set(sources)).slice(0, 3);

    return {
      prompt: data.imagePrompt || `Chibi full body illustration of ${userInput}, cute, detailed background, 4k`,
      referenceData: {
        traits: data.traits || { species: 'Unknown', hair: 'Unknown', eyes: 'Unknown', outfit: 'Unknown', distinctiveFeatures: 'Unknown' },
        sources: uniqueSources,
        referenceImageUrl: data.referenceImageUrl
      }
    };

  } catch (error) {
    console.warn("Prompt enhancement failed, using fallback.", error);
    return {
      prompt: `Chibi full body illustration of ${userInput}, cute, detailed background, 4k`,
      referenceData: {
        traits: { species: 'Unknown', hair: 'Unknown', eyes: 'Unknown', outfit: 'Unknown', distinctiveFeatures: 'Unknown' },
        sources: [],
      }
    };
  }
}

/**
 * Helper to generate image from a final prompt string (Initial Generation)
 */
async function generateImageFromPrompt(promptString: string): Promise<string> {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: promptString,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1', // IG Size (Square)
    },
  });

  const generatedImage = response.generatedImages?.[0];
  
  if (!generatedImage?.image?.imageBytes) {
    throw new Error("No image data received from the API.");
  }

  return `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;
}

/**
 * Generates the initial Chibi image using Imagen 3.
 */
export async function generateChibi(userInput: string): Promise<GenResult> {
  // Step 1: Enhance the prompt with Search Grounding & structured data extraction
  const { prompt, referenceData } = await enhancePrompt(userInput);
  console.log("Optimized Prompt:", prompt);

  // Step 2: Generate Image
  const imageUrl = await generateImageFromPrompt(prompt);

  return { imageUrl, effectivePrompt: prompt, referenceData };
}

/**
 * Refines the Chibi image using Image-to-Image editing (Gemini 2.5 Flash Image).
 * This preserves the visual composition of the previous image.
 */
export async function refineChibi(currentImageUri: string, adjustment: string): Promise<GenResult> {
  // Parse the Data URI
  const match = currentImageUri.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data format");
  }
  const mimeType = match[1];
  const base64Data = match[2];

  console.log("Refining image with adjustment:", adjustment);

  // Use Gemini 2.5 Flash Image for editing
  // It supports image + text input -> image output
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: `Edit this image. ${adjustment}. Maintain the high-quality chibi style.`,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  // Extract the generated image from candidates
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData && part.inlineData.data) {
    const newImageUrl = `data:image/png;base64,${part.inlineData.data}`;
    
    // For refinement, we don't re-research the traits, so we return empty/placeholder ref data
    // or ideally we could pass the old ref data if we had it in the signature, but let's just return empty for now.
    // The UI checks for existence before displaying.
    return { 
      imageUrl: newImageUrl, 
      effectivePrompt: adjustment,
      referenceData: {
        traits: { species: '-', hair: '-', eyes: '-', outfit: '-', distinctiveFeatures: '-' },
        sources: []
      }
    };
  }

  throw new Error("Failed to refine image. The model did not return an image.");
}
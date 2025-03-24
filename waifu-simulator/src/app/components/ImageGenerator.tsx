"use client";

import { useState } from 'react';
import Image from 'next/image';

// Gemini API key from the user input
const API_KEY = "AIzaSyAeU1jYORhUqR5C6vKlOM8bLWg9uwn4eE4";
// Using the image generation experimental model specifically
const GEMINI_MODEL = "gemini-2.0-flash-exp-image-generation";

type ImageGeneratorProps = {
  theme: string;
};

export default function ImageGenerator({ theme }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get theme-specific prompt suggestions
  const getThemeSuggestion = () => {
    switch(theme) {
      case 'theme-pastel':
        return "a cute anime girl with pink hair in pastel colors";
      case 'theme-cyber':
        return "a cyberpunk anime girl with neon blue highlights";
      case 'theme-fantasy':
        return "a fantasy elf anime girl with purple magic aura";
      case 'theme-classic':
        return "a classic anime school girl with red uniform";
      case 'theme-dark':
        return "a mysterious dark gothic anime girl with red eyes";
      default:
        return "a cute anime waifu";
    }
  };

  const generateImage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const finalPrompt = prompt || getThemeSuggestion();
      
      // Adding style guidance based on the current theme
      let stylePrompt = "";
      if (theme === 'theme-pastel') {
        stylePrompt = "in soft pastel pink and lavender colors, cute wholesome style";
      } else if (theme === 'theme-cyber') {
        stylePrompt = "with neon blue and pink cyberpunk styling, futuristic background";
      } else if (theme === 'theme-fantasy') {
        stylePrompt = "with royal purple and gold fantasy styling, magical background";
      } else if (theme === 'theme-classic') {
        stylePrompt = "with bright colors in classic anime style";
      } else if (theme === 'theme-dark') {
        stylePrompt = "with dark gothic styling, crimson and purple colors";
      }
      
      const enhancedPrompt = `Generate an anime-style image of ${finalPrompt} ${stylePrompt}. Make it a high quality anime illustration suitable for a waifu AI companion with beautiful detailed lighting and colors.`;
      
      // Using the gemini image generation model
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: enhancedPrompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          }),
        }
      );

      const data = await response.json();
      console.log("Gemini Image Generation API response:", data);
      
      // Process the response data
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        // Get the content from response
        const content = data.candidates[0].content;
        
        // Check if there's an image in the response
        const imagePart = content.parts.find((part: any) => part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/'));
        
        if (imagePart && imagePart.inlineData) {
          // Get the base64 image data
          const base64ImageData = imagePart.inlineData.data;
          // Create a data URL for the image
          const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${base64ImageData}`;
          setGeneratedImage(imageUrl);
          
          // Try to find text part for description
          const textPart = content.parts.find((part: any) => part.text);
          if (textPart && textPart.text) {
            setGeneratedText(textPart.text);
          } else {
            setGeneratedText(enhancedPrompt);
          }
        } else {
          // If we only got text back
          const textPart = content.parts.find((part: any) => part.text);
          if (textPart && textPart.text) {
            setGeneratedText(textPart.text);
            // Fall back to placeholder image
            const seed = encodeURIComponent(finalPrompt).substring(0, 20);
            setGeneratedImage(`https://picsum.photos/seed/${seed}/600/600`);
            throw new Error("Received text response only, no image was generated");
          } else {
            throw new Error("No image or text found in the response");
          }
        }
      } else if (data.error) {
        throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
      } else {
        throw new Error("Invalid response format from API");
      }
      
    } catch (err: any) {
      console.error('Error generating image:', err);
      setError(`Failed to generate image: ${err.message || 'Unknown error'}`);
      
      // If we don't already have a fallback image set in the error handling
      if (!generatedImage) {
        // Fall back to placeholder image if there's an error
        const seed = encodeURIComponent(prompt || getThemeSuggestion()).substring(0, 20);
        setGeneratedImage(`https://picsum.photos/seed/${seed}/600/600`);
        if (!generatedText) {
          setGeneratedText("Could not generate image with the requested model. Using placeholder image instead.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-generator">
      <h2 className="text-xl font-bold mb-4">Generate Your Waifu</h2>
      
      <div className="input-container">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Describe your waifu (e.g., ${getThemeSuggestion()})`}
          className="chat-input mb-2"
        />
        <button 
          onClick={generateImage}
          disabled={loading}
          className="send-button"
        >
          {loading ? 'Generating...' : 'Generate Image'}
        </button>
      </div>
      
      {error && <p className="text-red-500 mt-2">{error}</p>}
      
      {loading && (
        <div className="flex justify-center items-center my-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {generatedImage && !loading && (
        <div className="generated-image mt-4 transition-all duration-300 ease-in-out">
          <div className="relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden border-2 border-primary">
            <Image 
              src={generatedImage}
              alt="Generated Waifu"
              fill
              className="object-cover"
            />
          </div>
          
          {generatedText && (
            <div className="mt-4 p-3 rounded-lg bg-primary bg-opacity-10 text-sm">
              <p className="font-semibold mb-1">AI Generated Description:</p>
              <p>{generatedText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
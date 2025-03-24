"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ImageGenerator from "./components/ImageGenerator";

// Gemini API key from the user input
const API_KEY = "AIzaSyAeU1jYORhUqR5C6vKlOM8bLWg9uwn4eE4";
// Using the experimental model
const GEMINI_MODEL = "gemini-2.0-pro-exp-02-05";

type Message = {
  content: string;
  isUser: boolean;
  timestamp: Date;
};

export default function Home() {
  const [theme, setTheme] = useState("theme-pastel");
  const [messages, setMessages] = useState<Message[]>([
    {
      content: "Hello! I'm your waifu assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [showImageGen, setShowImageGen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const waifuName = "AI-chan";

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate a response from Gemini API
  const generateGeminiResponse = async (userInput: string) => {
    try {
      // Get theme-specific personality
      let personality = "";
      if (theme === 'theme-pastel') {
        personality = "cute, wholesome, and sweet. You speak with a soft and gentle tone.";
      } else if (theme === 'theme-cyber') {
        personality = "tech-savvy, futuristic, and slightly tsundere. You use tech jargon occasionally.";
      } else if (theme === 'theme-fantasy') {
        personality = "mystical, ethereal, and wise. You speak like a fantasy character with occasional magical references.";
      } else if (theme === 'theme-classic') {
        personality = "cheerful, energetic, and classic anime character. You use phrases like 'Ganbatte!' occasionally.";
      } else if (theme === 'theme-dark') {
        personality = "mysterious, dark, and slightly yandere. You speak in a slightly possessive but caring way.";
      }
      
      const promptText = `You are a friendly anime waifu assistant named ${waifuName} with a ${personality} personality. 
      Your response should be concise (1-3 sentences) and in character.
      
      User message: "${userInput}"
      
      ${waifuName}'s response:`;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: promptText }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 100,
            }
          }),
        }
      );
      
      const data = await response.json();
      console.log("Gemini chat response:", data);
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const textResponse = data.candidates[0].content.parts[0].text;
        // Clean up the response if needed
        const cleanedResponse = textResponse.replace(`${waifuName}'s response:`, '').trim();
        return cleanedResponse;
      } else {
        throw new Error("Invalid response format from Gemini API");
      }
    } catch (err) {
      console.error('Error generating response:', err);
      return "Gomen nasai! I'm having trouble connecting to my AI brain. Can you try again?";
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      content: inputText,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Check for image generation command
    if (inputText.toLowerCase().includes('generate image') || 
        inputText.toLowerCase().includes('create waifu') ||
        inputText.toLowerCase().includes('show image')) {
      setShowImageGen(true);
      
      // Add system message about image generation
      setTimeout(() => {
        const systemMessage: Message = {
          content: "I've opened the image generator for you! You can create your waifu image below.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, systemMessage]);
        setIsLoading(false);
      }, 500);
      
      return;
    }

    // Generate AI response using Gemini
    try {
      const aiResponse = await generateGeminiResponse(inputText);
      
      const waifuMessage: Message = {
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, waifuMessage]);
    } catch (error) {
      console.error('Error in chat response:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        content: "Gomen nasai! I'm having trouble connecting to my AI brain. Can you try again?",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  return (
    <div className={`${theme}`}>
      <div className="chat-container">
        <div className="chat-header">
          MyWaifu AI - {waifuName}
        </div>
        
        <div className="theme-selector">
          <button 
            className={`theme-button theme-button-pastel ${theme === 'theme-pastel' ? 'active' : ''}`} 
            onClick={() => changeTheme('theme-pastel')}
            title="Pastel Theme"
          />
          <button 
            className={`theme-button theme-button-cyber ${theme === 'theme-cyber' ? 'active' : ''}`} 
            onClick={() => changeTheme('theme-cyber')}
            title="Cyberpunk Theme"
          />
          <button 
            className={`theme-button theme-button-fantasy ${theme === 'theme-fantasy' ? 'active' : ''}`} 
            onClick={() => changeTheme('theme-fantasy')}
            title="Fantasy Theme"
          />
          <button 
            className={`theme-button theme-button-classic ${theme === 'theme-classic' ? 'active' : ''}`} 
            onClick={() => changeTheme('theme-classic')}
            title="Classic Anime Theme"
          />
          <button 
            className={`theme-button theme-button-dark ${theme === 'theme-dark' ? 'active' : ''}`} 
            onClick={() => changeTheme('theme-dark')}
            title="Dark Theme"
          />
        </div>
        
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.isUser ? 'user-message' : 'waifu-message'}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginLeft: message.isUser ? 'auto' : '0',
                marginRight: message.isUser ? '0' : 'auto'
              }}
            >
              {message.content}
              <small style={{ 
                fontSize: '0.65rem', 
                opacity: 0.7, 
                alignSelf: message.isUser ? 'flex-end' : 'flex-start',
                marginTop: '4px'
              }}>
                {message.isUser ? 'You' : waifuName} • {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </small>
            </div>
          ))}
          {isLoading && (
            <div className="message waifu-message typing-indicator">
              <div className="dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-container">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="chat-input"
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage} 
            className="send-button"
            disabled={isLoading}
          >
            Send
          </button>
        </div>
        
        {showImageGen && (
          <div className="image-generator-container mt-6 p-4 border border-primary rounded-lg bg-opacity-10 bg-white backdrop-blur-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Waifu Image Generator</h3>
              <button 
                onClick={() => setShowImageGen(false)}
                className="text-sm px-2 py-1 rounded-full bg-primary bg-opacity-20 hover:bg-opacity-30 transition-all"
              >
                Hide
              </button>
            </div>
            <ImageGenerator theme={theme} />
          </div>
        )}
      </div>
    </div>
  );
}

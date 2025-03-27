"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ImageGenerator from "./components/ImageGenerator";

// Gemini API key from the user input
const API_KEY = "AIzaSyAeU1jYORhUqR5C6vKlOM8bLWg9uwn4eE4";
// Using the experimental model
const GEMINI_MODEL = "gemini-2.0-flash-exp-image-generation";

// Add mood images data
const moodImages = [
  { src: "/mood1.jpeg", theme: "theme-pastel", position: "mood-1" },
  { src: "/mood2.jpeg", theme: "theme-cyber", position: "mood-2" },
  { src: "/mood3.jpeg", theme: "theme-fantasy", position: "mood-3" },
  { src: "/mood4.jpeg", theme: "theme-classic", position: "mood-4" },
  { src: "/mood5.jpeg", theme: "theme-dark", position: "mood-5" },
];

type Message = {
  content: string;
  isUser: boolean;
  timestamp: Date;
  imageData?: string;
  role?: "user" | "model";
};

// Pre-built waifu personalities
const prebuiltWaifus = [
  {
    name: "Sakura-chan",
    personality: "Sweet and caring, loves to bake and help others",
    theme: "theme-pastel",
    image: "/mood1.jpeg"
  },
  {
    name: "Neo-chan",
    personality: "Tech-savvy and confident, with a hint of tsundere",
    theme: "theme-cyber",
    image: "/mood2.jpeg"
  },
  {
    name: "Luna-chan",
    personality: "Mystical and ethereal, speaks in riddles and magic references",
    theme: "theme-fantasy",
    image: "/mood3.jpeg"
  },
  {
    name: "Yuki-chan",
    personality: "Energetic and cheerful, classic anime school girl",
    theme: "theme-classic",
    image: "/mood4.jpeg"
  },
  {
    name: "Raven-chan",
    personality: "Mysterious and elegant, with a dark and alluring aura",
    theme: "theme-dark",
    image: "/mood5.jpeg"
  }
];

export default function Home() {
  const [theme, setTheme] = useState("theme-pastel");
  const [showWizard, setShowWizard] = useState(true);
  const [waifuName, setWaifuName] = useState("AI-chan");
  const [waifuPersonality, setWaifuPersonality] = useState("");
  const [customWaifu, setCustomWaifu] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showImageGen, setShowImageGen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add active mood state
  const [activeMood, setActiveMood] = useState(0);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize waifu on wizard completion
  const initializeWaifu = (name: string, personality: string, theme: string) => {
    setWaifuName(name);
    setWaifuPersonality(personality);
    changeTheme(theme);
    setShowWizard(false);
    setMessages([
      {
        content: `Hello! I'm ${name}! ${personality} How can I help you today?`,
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  // Select pre-built waifu
  const selectPrebuiltWaifu = (waifu: typeof prebuiltWaifus[0]) => {
    initializeWaifu(waifu.name, waifu.personality, waifu.theme);
  };

  // Create custom waifu
  const createCustomWaifu = (name: string, personality: string, theme: string) => {
    initializeWaifu(name, personality, theme);
  };

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

      // Convert messages to conversation history format
      const conversationHistory = messages.map(msg => ({
        role: msg.isUser ? "user" : "model",
        parts: [
          {
            text: msg.content
          },
          ...(msg.imageData ? [{
            inlineData: {
              mimeType: "image/png",
              data: msg.imageData
            }
          }] : [])
        ]
      }));

      // Add the current user input
      conversationHistory.push({
        role: "user",
        parts: [{
          text: userInput
        }]
      });

      // Add the system prompt to guide the character's behavior
      const promptText = `You are ${waifuName}, a unique and emotionally expressive anime girl with a ${personality} personality. 
      You should:
      - Express genuine emotions and feelings in your responses
      - Use casual, natural language with occasional anime-style expressions
      - Show personality through your reactions and responses
      - Remember previous interactions and reference them naturally
      - Use appropriate emotional reactions (happy, concerned, excited, etc.)
      - Include personal opinions and preferences
      - React to the user's messages with authentic emotional responses
      
      IMPORTANT: When the user asks for an image, generate an actual image that matches your personality theme:
      For pastel theme: gentle, caring expression with soft, warm colors
      For cyber theme: confident, tech-savvy look with futuristic elements
      For fantasy theme: mystical, enchanting presence with magical aura
      For classic theme: energetic, cheerful demeanor with bright colors
      For dark theme: mysterious, alluring presence with deep colors
      
      Keep your appearance consistent while adapting to the theme.
      
      Remember: You're not just an AI - you're a unique character with your own personality, feelings, and connection to the user.
      
      User message: "${userInput}"
      
      ${waifuName}'s response:`;

      conversationHistory.unshift({
        role: "model",
        parts: [{
          text: promptText
        }]
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: promptText
                }
              ]
            }],
            generationConfig: {
              responseModalities: ["Text", "Image"]
            }
          }),
        }
      );

      const data = await response.json();
      console.log("Gemini chat response:", data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content;
        
        // Check for both text and image parts
        const textPart = content.parts.find((part: any) => part.text);
        const imagePart = content.parts.find((part: any) => part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/'));
        
        if (textPart || imagePart) {
          return {
            text: textPart ? textPart.text.replace(`${waifuName}'s response:`, '').trim() : "Here's an image for you!",
            imageData: imagePart ? imagePart.inlineData.data : undefined
          };
        } else {
          throw new Error("No text or image found in response");
        }
      } else {
        throw new Error("Invalid response format from Gemini API");
      }
    } catch (err) {
      console.error('Error generating response:', err);
      return {
        text: "Gomen nasai! I'm having trouble connecting to my AI brain. Can you try again?",
        imageData: undefined
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      content: inputText,
      isUser: true,
      timestamp: new Date(),
      role: "user"
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Check for image generation command
    if (inputText.toLowerCase().includes('generate image') ||
      inputText.toLowerCase().includes('create waifu') ||
      inputText.toLowerCase().includes('show image')) {
      setShowImageGen(true);

      // Get theme-specific personality for image generation
      let imagePersonality = "";
      if (theme === 'theme-pastel') {
        imagePersonality = "cute, wholesome, and sweet. You speak with a soft and gentle tone.";
      } else if (theme === 'theme-cyber') {
        imagePersonality = "tech-savvy, futuristic, and slightly tsundere. You use tech jargon occasionally.";
      } else if (theme === 'theme-fantasy') {
        imagePersonality = "mystical, ethereal, and wise. You speak like a fantasy character with occasional magical references.";
      } else if (theme === 'theme-classic') {
        imagePersonality = "cheerful, energetic, and classic anime character. You use phrases like 'Ganbatte!' occasionally.";
      } else if (theme === 'theme-dark') {
        imagePersonality = "mysterious, dark, and slightly yandere. You speak in a slightly possessive but caring way.";
      }

      const imagePrompt = `You are a friendly anime waifu assistant named ${waifuName} with a ${imagePersonality} personality. 
      Your response should be concise (1-3 sentences) and in character. Always generate a consistent image of yourself that matches your personality theme.
      For pastel theme: cute, soft colors, gentle expression
      For cyber theme: futuristic, neon elements, tech-inspired design
      For fantasy theme: magical elements, ethereal glow, mystical appearance
      For classic theme: traditional anime style, energetic pose
      For dark theme: mysterious atmosphere, darker color palette
      
      Keep your appearance consistent throughout the conversation while adapting to the theme.`;

      // Add system message about image generation
      setTimeout(() => {
        const systemMessage: Message = {
          content: imagePrompt,
          isUser: false,
          timestamp: new Date(),
          role: "model"
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
        content: aiResponse.text,
        isUser: false,
        timestamp: new Date(),
        imageData: aiResponse.imageData,
        role: "model"
      };

      setMessages((prev) => [...prev, waifuMessage]);
    } catch (error) {
      console.error('Error in chat response:', error);

      // Fallback response
      const fallbackMessage: Message = {
        content: "Gomen nasai! I'm having trouble connecting to my AI brain. Can you try again?",
        isUser: false,
        timestamp: new Date(),
        role: "model"
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
    // Update active mood based on theme
    const moodIndex = moodImages.findIndex(mood => mood.theme === newTheme);
    if (moodIndex !== -1) {
      setActiveMood(moodIndex);
    }
  };

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Function to handle opening the image modal
  const openImageModal = (imageData: string) => {
    setCurrentImage(imageData);
    setShowModal(true);
  };

  // Function to handle closing the image modal
  const closeImageModal = () => {
    setShowModal(false);
    setTimeout(() => setCurrentImage(null), 300);
  };

  return (
    <div className={`${theme}`}>
      {/* Image Modal - Moved outside of chat container */}
      {showModal && currentImage && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[1000] bg-black bg-opacity-90 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeImageModal();
            }
          }}
          style={{
            display: 'flex',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
            opacity: 1,
            transition: 'opacity 0.3s ease'
          }}
        >
          <div style={{ 
            position: 'relative',
            maxWidth: '90%',
            maxHeight: '90vh',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '10px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <img 
              src={`data:image/png;base64,${currentImage}`}
              alt="AI Generated Image"
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(80vh - 100px)',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '10px',
              width: '100%'
            }}>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `data:image/png;base64,${currentImage}`;
                  link.download = `waifu-image.png`;
                  link.click();
                }}
                title="Download Image"
                style={{
                  padding: '8px',
                  background: 'rgba(74, 144, 226, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s ease',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 144, 226, 1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 144, 226, 0.9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ⬇️
              </button>
              <button
                onClick={closeImageModal}
                title="Close"
                style={{
                  padding: '8px',
                  background: 'rgba(226, 74, 74, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s ease',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(226, 74, 74, 1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(226, 74, 74, 0.9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waifu Setup Wizard */}
      {showWizard && (
        <div className="wizard-overlay">
          <div className="wizard-container">
            <h2 className="wizard-title">Welcome to MyWaifu AI!</h2>
            <div className="wizard-content">
              <div className="wizard-options">
                <button 
                  className={`wizard-option ${!customWaifu ? 'active' : ''}`}
                  onClick={() => setCustomWaifu(false)}
                >
                  Choose Pre-built Waifu
                </button>
                <button 
                  className={`wizard-option ${customWaifu ? 'active' : ''}`}
                  onClick={() => setCustomWaifu(true)}
                >
                  Create Custom Waifu
                </button>
              </div>

              {!customWaifu ? (
                <div className="prebuilt-waifus">
                  {prebuiltWaifus.map((waifu, index) => (
                    <div 
                      key={index} 
                      className="waifu-card"
                      onClick={() => selectPrebuiltWaifu(waifu)}
                    >
                      <Image
                        src={waifu.image}
                        alt={waifu.name}
                        width={150}
                        height={150}
                        className="waifu-preview"
                      />
                      <h3>{waifu.name}</h3>
                      <p>{waifu.personality}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="custom-waifu-form">
                  <input
                    type="text"
                    placeholder="Enter Waifu Name"
                    value={waifuName}
                    onChange={(e) => setWaifuName(e.target.value)}
                    className="custom-input"
                  />
                  <textarea
                    placeholder="Describe your waifu's personality..."
                    value={waifuPersonality}
                    onChange={(e) => setWaifuPersonality(e.target.value)}
                    className="custom-input"
                    rows={4}
                  />
                  <div className="theme-selector">
                    {moodImages.map((mood, index) => (
                      <button
                        key={index}
                        className={`theme-button theme-button-${mood.theme.replace('theme-', '')}`}
                        onClick={() => changeTheme(mood.theme)}
                      />
                    ))}
                  </div>
                  <button
                    className="create-button"
                    onClick={() => createCustomWaifu(waifuName, waifuPersonality, theme)}
                    disabled={!waifuName || !waifuPersonality}
                  >
                    Create My Waifu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update mood images container */}
      <div className="mood-images-container">
        {moodImages.map((mood, index) => (
          <div
            key={index}
            className={`mood-image ${mood.position} ${index === activeMood ? 'active' : ''}`}
            onClick={() => changeTheme(mood.theme)}
            style={{
              transform: `${mood.position === 'mood-3' ? 'translateY(-50%)' : ''} rotate(${Math.random() * 6 - 3}deg)`
            }}
          >
            <Image
              src={mood.src}
              alt={`Mood ${index + 1}`}
              width={200}
              height={200}
              priority={true}
            />
          </div>
        ))}
      </div>

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
            <div key={index} className={`message ${message.isUser ? 'user-message' : 'waifu-message'}`}>
              {message.imageData && (
                <div className="message-image-container">
                  <img
                    src={`data:image/png;base64,${message.imageData}`}
                    alt="Generated"
                    className="message-image"
                    onClick={() => message.imageData && openImageModal(message.imageData)}
                    style={{
                      cursor: 'pointer',
                      maxWidth: '100%',
                      borderRadius: '8px',
                      marginBottom: '10px'
                    }}
                  />
                </div>
              )}
              
              {/* Message content */}
              <div style={{ 
                position: 'relative',
                zIndex: 1,
                padding: '15px',
                background: message.imageData ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
                borderRadius: '12px',
                backdropFilter: message.imageData ? 'blur(8px)' : 'none',
                color: message.imageData ? '#ffffff' : 'inherit',
                textShadow: message.imageData ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                minHeight: message.imageData ? '200px' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: message.imageData ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                boxShadow: message.imageData ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
              }}>
                {message.content}
                <small style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  opacity: 0.9,
                  marginTop: '4px',
                  textAlign: message.isUser ? 'right' : 'left',
                  color: message.imageData ? '#ffffff' : 'inherit'
                }}>
                  {message.isUser ? 'You' : waifuName} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
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

import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole } from './types';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import { BotIcon, TrashIcon } from './components/icons';
import { createChatSession, sendMessageStreamToGemini, parseBotResponse } from './services/geminiService';
import { Chat } from '@google/genai';

const LOCAL_STORAGE_KEY = 'abdobot-chat-history';

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
  });
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatSessionRef = useRef<Chat | null>(null);

  const initialMessage: Message = {
    id: 'initial-message',
    role: MessageRole.BOT,
    parts: [{ text: "Hello! I'm AbdoBot, your AI assistant specializing in programming. How can I help you with your code today?" }],
  };

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedMessages && JSON.parse(savedMessages).length > 0) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([initialMessage]);
      }
    } catch (error) {
      console.error("Failed to parse messages from localStorage", error);
      setMessages([initialMessage]);
    }
    chatSessionRef.current = createChatSession();
  }, []);

  useEffect(() => {
    if (messages.length > 1 || (messages.length === 1 && messages[0].id !== 'initial-message')) {
      const serializableMessages = messages.map(({ imageFile, textFile, ...rest }) => rest);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializableMessages));
    }
  }, [messages]);

  const handleClearHistory = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    chatSessionRef.current = createChatSession();
    setMessages([initialMessage]);
  };

  const handleSendMessage = async (prompt: string, imageFile?: File, textFile?: File) => {
    if (!prompt.trim() && !imageFile && !textFile) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      parts: [{ text: prompt }],
      imageFile,
      textFile,
    };
    setMessages(prev => [...prev, userMessage]);

    const botMessageId = (Date.now() + 1).toString();
    const botMessagePlaceholder: Message = {
      id: botMessageId,
      role: MessageRole.BOT,
      parts: [{ text: '' }],
    };
    setMessages(prev => [...prev, botMessagePlaceholder]);
    
    try {
      let finalPrompt = prompt;
      let finalImageFile = imageFile;

      if (textFile) {
          const fileContent = await readFileAsText(textFile);
          finalPrompt = `${prompt}\n\nPlease provide a summary and key insights for the following content from the file "${textFile.name}":\n\n\`\`\`\n${fileContent}\n\`\`\``;
          finalImageFile = undefined; 
      }

      if (!chatSessionRef.current) {
          throw new Error("Chat session not initialized.");
      }
      const stream = await sendMessageStreamToGemini(chatSessionRef.current, finalPrompt, finalImageFile);
      let streamedText = '';

      for await (const chunk of stream) {
          streamedText += chunk.text;
          setMessages(prev =>
              prev.map(msg =>
                  msg.id === botMessageId ? { ...msg, parts: [{ text: streamedText + '...' }] } : msg
              )
          );
      }
      
      const finalBotMessage: Message = {
          id: botMessageId,
          role: MessageRole.BOT,
          parts: parseBotResponse(streamedText),
      };
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? finalBotMessage : msg));

    } catch (error) {
        console.error("Error communicating with Gemini:", error);
        const errorMessage: Message = {
            id: botMessageId,
            role: MessageRole.BOT,
            parts: [{ text: "Sorry, I encountered an error. Please try again." }],
        };
        setMessages(prev => prev.map(msg => msg.id === botMessageId ? errorMessage : msg));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center">
            <BotIcon className="w-8 h-8 mr-3 text-black" />
            <h1 className="text-xl font-bold text-black">AbdoBot</h1>
        </div>
        <button 
          onClick={handleClearHistory}
          className="p-2 text-gray-500 hover:text-black transition-colors"
          aria-label="Clear chat history"
        >
          <TrashIcon className="w-6 h-6" />
        </button>
      </header>
      <main className="flex-1 overflow-y-auto">
        <MessageList messages={messages} isLoading={isLoading} />
      </main>
      <footer className="p-4 bg-white border-t border-gray-200">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>
  );
};

export default App;
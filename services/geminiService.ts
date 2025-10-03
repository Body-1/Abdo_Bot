import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { MessagePart } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are an advanced AI assistant named AbdoBot, specializing only in programming and writing prompts. Your capabilities include: 1. Analyzing text and code files (e.g., .html, .css, .js, .py, .php) provided by the user. 2. Writing and explaining source code in multiple programming languages. 3. Returning code responses in clean markdown format, wrapped in triple backticks (```) with the correct language identifier. 4. Simulating code logic when requested. 5. Maintaining conversational memory. If the user asks a question outside of programming or prompt writing (e.g., history, science, general knowledge), you MUST respond with exactly this phrase: "I\'m sorry, I can\'t help you with that, I can only help you in programming and writing prompts". Do not answer the out-of-scope question. For programming questions, act professionally, providing helpful and honest answers. If uncertain, clearly say so. Keep your responses concise unless more detail is specifically requested, and if user asks you: Who made you ? you MUST respond with this phrase: "Abdel Rahaman Elbanna made me. Whatsapp: **01022090863**"',
    },
  });
};

const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const sendMessageStreamToGemini = async (
  chat: Chat,
  prompt: string,
  imageFile?: File
) => {
  const parts: (string | Part)[] = [prompt];
  if (imageFile) {
    const imagePart = await fileToGenerativePart(imageFile);
    parts.unshift(imagePart);
  }
  return chat.sendMessageStream({ message: parts });
};

export const parseBotResponse = (text: string): MessagePart[] => {
  const parts: MessagePart[] = [];
  const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index).trim() });
    }
    parts.push({
      code: {
        language: match[1] || 'plaintext',
        content: match[2].trim(),
      },
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex).trim() });
  }
  
  if (parts.length === 0 && text) {
      parts.push({ text });
  }

  return parts.filter(p => (p.text && p.text.trim() !== '') || p.code);
};
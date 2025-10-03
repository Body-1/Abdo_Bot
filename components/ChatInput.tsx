import React, { useState, useRef, KeyboardEvent } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, XCircleIcon, DocumentTextIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (prompt: string, imageFile?: File, textFile?: File) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleRemoveFile();
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setTextFile(file);
      }
    }
  };

  const handleRemoveFile = () => {
    setImageFile(null);
    setImagePreview(null);
    setTextFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    if ((prompt.trim() || imageFile || textFile) && !isLoading) {
      onSendMessage(prompt, imageFile || undefined, textFile || undefined);
      setPrompt('');
      handleRemoveFile();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    setPrompt(textarea.value);
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <div className="bg-white rounded-xl p-2 flex flex-col gap-2 border border-gray-300 focus-within:ring-1 focus-within:ring-black/50 transition-colors">
      {imagePreview && (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden">
          <img src={imagePreview} alt="Selected preview" className="w-full h-full object-cover" />
          <button
            onClick={handleRemoveFile}
            className="absolute top-1 right-1 bg-gray-500/50 text-white rounded-full p-0.5 hover:bg-gray-500/80 transition-colors"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      )}
      {textFile && (
        <div className="relative flex items-center gap-3 bg-gray-100 p-2 rounded-lg border border-gray-200">
          <DocumentTextIcon className="w-8 h-8 text-gray-500 flex-shrink-0" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-gray-800 text-sm font-medium truncate">{textFile.name}</span>
            <span className="text-gray-500 text-xs">{(textFile.size / 1024).toFixed(2)} KB</span>
          </div>
          <button
            onClick={handleRemoveFile}
            className="absolute top-1 right-1 bg-gray-500/50 text-white rounded-full p-0.5 hover:bg-gray-500/80 transition-colors"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-black disabled:opacity-50 transition-colors"
          disabled={isLoading}
        >
          <PaperClipIcon className="w-6 h-6" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="text/*,.js,.jsx,.ts,.tsx,.html,.css,.json,.py,.php,.java,.c,.cpp,.cs,.rb,.go,.rs,.swift,.md, .sql"
        />
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="w-full bg-transparent resize-none focus:outline-none text-black placeholder-gray-500 max-h-48"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || (!prompt.trim() && !imageFile && !textFile)}
          className="p-2 rounded-md bg-black text-white disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-800 transition-colors"
        >
          <PaperAirplaneIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
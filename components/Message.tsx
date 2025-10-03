import React from 'react';
import { Message, MessageRole, MessagePart } from '../types';
import { UserIcon, BotIcon, DocumentTextIcon } from './icons';
import CodeBlock from './CodeBlock';

interface MessageBubbleProps {
  message: Message;
}

const isArabic = (text = ''): boolean => /[\u0600-\u06FF]/.test(text);

const renderTextWithBold = (text: string) => {
  if (!text) return null;

  const lines = text.split(/\r?\n/);

  const renderedLines = lines.map((line, lineIndex) => {
    if (/^\s*###\s+/.test(line)) {
      const content = line.replace(/^\s*###\s+/, '');
      return (
        <h3 key={`h3-${lineIndex}`} className="font-semibold my-2">
          {renderInline(content)}
        </h3>
      );
    }

    return (
      <p key={`p-${lineIndex}`} className="whitespace-pre-wrap m-0">
        {renderInline(line)}
      </p>
    );
  });

  return renderedLines;
};

const renderInline = (text: string) => {
  if (!text) return null;

  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g).filter(Boolean);

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={i} className="bg-gray-100 px-1 rounded text-sm font-mono">
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
};


const MessagePartContent: React.FC<{ part: MessagePart }> = ({ part }) => {
  if (part.code) {
    return <CodeBlock language={part.code.language} content={part.code.content} />;
  }
  if (part.imageUrl) {
    return <img src={part.imageUrl} alt="Generated content" className="mt-2 rounded-lg max-w-sm" />;
  }
  return <p className="whitespace-pre-wrap">{renderTextWithBold(part.text || '')}</p>;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;

  const userImagePreview = message.imageFile ? URL.createObjectURL(message.imageFile) : null;
  const userTextFile = message.textFile;

  const iconBgClass = isUser ? 'bg-black' : 'bg-gray-100';
  const icon = isUser ? 
    <UserIcon className="w-6 h-6 text-white" /> : 
    <BotIcon className="w-6 h-6 text-black" />;
  
  const bubbleClass = isUser ? 
    'bg-gray-100 text-black rounded-br-none' : 
    'bg-white text-black rounded-bl-none';

  const messageText = message.parts.map(p => p.text || '').join(' ');
  const isRtl = isArabic(messageText);

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${iconBgClass}`}>
        {icon}
      </div>
      <div 
        className={`max-w-xl md:max-w-2xl w-fit p-3 rounded-xl ${bubbleClass} ${isRtl ? 'text-right' : 'text-left'}`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {userImagePreview && (
          <div className="mb-2">
            <img src={userImagePreview} alt="User upload" className="rounded-lg max-w-xs" />
          </div>
        )}
        {userTextFile && (
          <div className="mb-2 p-2 bg-white rounded-lg flex items-center gap-2 border border-gray-200">
              <DocumentTextIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-800 font-mono truncate">{userTextFile.name}</span>
          </div>
        )}
        {message.parts.map((part, index) => (
          <MessagePartContent key={index} part={part} />
        ))}
      </div>
    </div>
  );
};

export default MessageBubble;
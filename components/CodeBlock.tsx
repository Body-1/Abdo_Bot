import React, { useState, useEffect, useRef } from 'react';
import { ClipboardIcon, CheckIcon } from './icons';

declare const Prism: any;

interface CodeBlockProps {
  language: string;
  content: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, content }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (codeRef.current && typeof Prism !== 'undefined') {
      Prism.highlightElement(codeRef.current);
    }
  }, [language, content]);

  const handleCopy = () => {
    const doCopied = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(doCopied).catch(() => {
        // fallback below
        const textarea = document.createElement('textarea');
        textarea.value = content;
        // Move offscreen
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          doCopied();
        } catch (e) {
          // ignore
        }
        document.body.removeChild(textarea);
      });
    } else {
      // older browsers fallback
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        doCopied();
      } catch (e) {
        // ignore
      }
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="bg-black rounded-lg my-2 overflow-hidden text-sm">
      <div className="flex justify-between items-center px-4 py-1 bg-gray-800 text-gray-400 text-xs">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          type="button"
          aria-label={`Copy ${language} code`}
          className="flex items-center gap-1.5 hover:text-white"
        >
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardIcon className="w-4 h-4" />
              Copy code
            </>
          )}
        </button>
      </div>
      <pre className={`language-${language} !bg-transparent p-4 overflow-x-auto`} dir="ltr">
        <code ref={codeRef} className={`language-${language}`}>
          {content}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
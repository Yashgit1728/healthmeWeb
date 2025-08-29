import React from 'react';
import { format } from 'date-fns';
import { TypingDots } from './TypingDots';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export function ChatMessage({ 
  content, 
  isUser, 
  timestamp, 
  isTyping
}: ChatMessageProps) {
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2 mb-4`}>
      {/* Message Bubble */}
      <div 
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        }`}
      >
        <p className={`text-sm ${isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
          {content}
        </p>
        {isTyping && <TypingDots />}
      </div>

      {/* Timestamp */}
      <div className="flex flex-col items-start space-y-2">
        <span className="text-xs text-gray-400 dark:text-gray-500 px-1">
          {format(timestamp, 'h:mm a')}
        </span>
      </div>
    </div>
  );
}
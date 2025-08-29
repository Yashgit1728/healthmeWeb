import React from 'react';

export function TypingDots() {
  return (
    <div className="flex items-center space-x-1 px-2">
      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" 
           style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" 
           style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" 
           style={{ animationDelay: '300ms' }} />
    </div>
  );
}

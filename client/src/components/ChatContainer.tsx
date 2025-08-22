import React from 'react';
import { ChatMessage } from './ChatMessage';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatContainerProps {
  messages: Message[];
  onQuickActionClick?: (action: string) => void;
}

export function ChatContainer({ messages, onQuickActionClick }: ChatContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Welcome to Your Journal
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Share your thoughts and feelings, and I'll be here to listen and reflect with you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
    >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          content={message.content}
          isUser={message.isUser}
          timestamp={message.timestamp}
          isTyping={message.isTyping}
          onQuickActionClick={onQuickActionClick}
        />
      ))}
    </div>
  );
}
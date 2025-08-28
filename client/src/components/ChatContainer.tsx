import { useEffect, useRef, RefObject } from 'react';
import { ChatMessage } from './ChatMessage';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  suggestions?: {
    suggestions: Array<{
      title: string;
      description: string;
      steps: string[];
      whyItHelps: string;
    }>;
    summary: string;
    category: string;
  };
}

interface ChatContainerProps {
  messages: Message[];
  containerRef?: RefObject<HTMLDivElement | null>;
}

export function ChatContainer({ messages, containerRef: externalRef }: ChatContainerProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = externalRef || internalRef;

  console.log('ChatContainer received messages:', messages);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, containerRef]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">💭</div>
          <h3 className="text-xl font-semibold mb-2">Welcome to Your Journal</h3>
          <p className="text-sm">Share your thoughts and feelings, and I'll be here to listen and support you.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto p-4 space-y-4 scroll-smooth"
      style={{ height: '100%' }}
    >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          content={message.content}
          isUser={message.isUser}
          timestamp={message.timestamp}
          isTyping={message.isTyping}
          suggestions={message.suggestions}
        />
      ))}
    </div>
  );
}
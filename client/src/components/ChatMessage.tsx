import { format } from 'date-fns';
import { TypingDots } from './TypingDots';
import { AISuggestions } from './AISuggestions';

interface ChatMessageProps {
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

export function ChatMessage({ content, isUser, timestamp, isTyping, suggestions }: ChatMessageProps) {
  if (isTyping) {
    return <TypingDots />;
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message Bubble */}
        <div 
          className={`px-6 py-4 rounded-2xl shadow-lg ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
              : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700'
          }`}
        >
          <p className={`text-base leading-relaxed ${isUser ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
            {content}
          </p>
          
          {/* Display AI suggestions if present */}
          {!isUser && suggestions && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <AISuggestions
                suggestions={suggestions.suggestions}
                summary={suggestions.summary}
                category={suggestions.category}
                isLoading={false}
              />
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {format(timestamp, 'h:mm a')}
          </span>
        </div>
      </div>
    </div>
  );
}
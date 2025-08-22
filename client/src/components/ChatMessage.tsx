import React, { useState } from 'react';
import { format } from 'date-fns';
import { TypingDots } from './TypingDots';

interface QuickAction {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  onQuickActionClick?: (action: string) => void;
}

export function ChatMessage({ 
  content, 
  isUser, 
  timestamp, 
  isTyping,
  onQuickActionClick 
}: ChatMessageProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'breathing',
      label: "Try breathing exercise",
      onClick: () => {
        setSelectedAction('breathing');
        onQuickActionClick?.('breathing');
      },
      disabled: isTyping || selectedAction !== null
    },
    {
      id: 'reframe',
      label: "Reframe thought",
      onClick: () => {
        setSelectedAction('reframe');
        onQuickActionClick?.('reframe');
      },
      disabled: isTyping || selectedAction !== null
    },
    {
      id: 'insight',
      label: "Save as insight",
      onClick: () => {
        setSelectedAction('insight');
        onQuickActionClick?.('insight');
      },
      disabled: isTyping || selectedAction !== null
    }
  ];

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

      {/* Timestamp and Quick Actions */}
      <div className="flex flex-col items-start space-y-2">
        <span className="text-xs text-gray-400 dark:text-gray-500 px-1">
          {format(timestamp, 'h:mm a')}
        </span>

        {/* Quick actions - only show for assistant messages and when not typing */}
        {!isUser && !isTyping && (
          <div className="flex flex-wrap gap-2 mt-1">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  px-3 py-1.5 text-sm rounded-full border transition-colors
                  ${selectedAction === action.id 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                    : 'text-black dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                  disabled:opacity-50 disabled:cursor-not-allowed
                  disabled:hover:bg-white dark:disabled:hover:bg-gray-800
                `}
              >
                {action.label}
                {selectedAction === action.id && (
                  <span className="ml-2 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
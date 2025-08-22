import React, { useState, useCallback, useEffect } from 'react';
import { FaceSmileIcon, HashtagIcon } from '@heroicons/react/24/outline';

interface JournalInputProps {
  onSubmit: (data: { text: string; mood: number; tags: string[] }) => void;
  isLoading: boolean;
}

const MAX_LENGTH = 1000;

export function JournalInput({ onSubmit, isLoading }: JournalInputProps) {
  const [text, setText] = useState('');
  const [mood, setMood] = useState(5);
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !isLoading) {
      onSubmit({ text: text.trim(), mood, tags });
      setText('');
    }
  }, [text, mood, tags, isLoading, onSubmit]);

  // Handle Ctrl/Cmd + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setText(value);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mood Picker */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">How are you feeling?</span>
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m * 2)} // Scale 1-5 to 2-10
                className={`h-8 w-8 rounded-full flex items-center justify-center border transition-colors ${
                  mood === m * 2
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
                aria-label={`Mood ${m * 2}`}
              >
                <span className="text-base">
                  {m === 1 ? '😞' : m === 2 ? '😐' : m === 3 ? '🙂' : m === 4 ? '😊' : '😄'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={handleChange}
            placeholder="How are you feeling today? Share your thoughts..."
            className="w-full min-h-[150px] p-4 rounded-lg border border-gray-300 dark:border-gray-600 
                     dark:bg-gray-700 resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <div className="absolute bottom-4 right-4 flex items-center space-x-4 text-gray-400">
            <button 
              type="button" 
              className="hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-gray-600"
              aria-label="Add emoji"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
            <button 
              type="button" 
              className="hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-gray-600"
              aria-label="Add tag"
            >
              <HashtagIcon className="w-5 h-5" />
            </button>
            <span className="text-sm">
              {text.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg 
                   font-medium transition-all transform hover:translate-y-[-1px] hover:shadow-lg 
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   dark:focus:ring-offset-gray-800"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            'Get Reflection'
          )}
        </button>
      </form>
    </div>
  );
}
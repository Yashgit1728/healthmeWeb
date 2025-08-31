import React, { useState, useCallback } from 'react';

interface JournalInputProps {
  onSubmit: (data: { text: string; mood: number; tags: string[]; chatSessionId?: string }) => void;
  isLoading?: boolean;
  chatSessionId?: string;
}

export function JournalInput({ onSubmit, isLoading, chatSessionId }: JournalInputProps) {
  const [text, setText] = useState('');
  const [mood, setMood] = useState(5);
  const [tags] = useState<string[]>([]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || isLoading) return;
    
    onSubmit({ text: text.trim(), mood, tags, chatSessionId });
    setText('');
    setMood(5);
  }, [text, mood, tags, chatSessionId, onSubmit, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        How are you feeling today?
      </h3>
      
      {/* Mood Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Select your mood:
        </label>
        <div className="flex items-center justify-between max-w-md">
          {[1, 2, 3, 4, 5].map((moodValue) => (
            <button
              key={moodValue}
              onClick={() => setMood(moodValue)}
              className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                mood === moodValue
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
              }`}
            >
              <span className="text-2xl mb-1">
                {moodValue === 1 ? '😢' : moodValue === 2 ? '😕' : moodValue === 3 ? '😐' : moodValue === 4 ? '🙂' : '😊'}
              </span>
              <span className={`text-xs font-medium ${
                mood === moodValue 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {moodValue === 1 ? 'Very Low' : moodValue === 2 ? 'Low' : moodValue === 3 ? 'Neutral' : moodValue === 4 ? 'Good' : 'Great'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div className="mb-6">
        <label htmlFor="journal-text" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Share your thoughts:
        </label>
        <textarea
          id="journal-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="How are you feeling today? What's on your mind? Share your thoughts..."
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none transition-all duration-200"
          rows={4}
          disabled={isLoading}
        />
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>💭</span>
            <span>#</span>
            <span>✨</span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {text.length}/1000
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Getting Reflection...
            </div>
          ) : (
            'Get Reflection'
          )}
        </button>
        
        <button
          type="button"
          onClick={() => {
            if (text.trim()) {
              // Trigger suggestions for the current text
              const event = new CustomEvent('requestSuggestions', { 
                detail: { text: text.trim() } 
              });
              window.dispatchEvent(event);
            }
          }}
          disabled={!text.trim()}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed"
        >
          💡 Get Tips
        </button>
      </div>
    </div>
  );
}
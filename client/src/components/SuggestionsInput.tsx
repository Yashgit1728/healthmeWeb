import React, { useState } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';

interface SuggestionsInputProps {
  onRequestSuggestions: (problem: string, category: 'emotional' | 'mental' | 'physical') => void;
  isLoading?: boolean;
}

export function SuggestionsInput({ onRequestSuggestions, isLoading }: SuggestionsInputProps) {
  const [problem, setProblem] = useState('');
  const [category, setCategory] = useState<'emotional' | 'mental' | 'physical'>('emotional');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem.trim()) {
      onRequestSuggestions(problem.trim(), category);
      setProblem('');
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group hover:shadow-lg"
      >
        <div className="flex items-center justify-center gap-4 text-blue-600 dark:text-blue-400">
          <LightBulbIcon className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="text-center">
            <span className="text-lg font-semibold block group-hover:scale-105 transition-transform duration-300">
              Need suggestions? Ask for help!
            </span>
            <p className="text-sm text-blue-500 dark:text-blue-400 mt-2 opacity-80">
              Get personalized solutions for emotional, mental, or physical challenges
            </p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <LightBulbIcon className="h-6 w-6 text-blue-500" />
          Get AI-Powered Suggestions
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold hover:scale-110 transition-all duration-200"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Problem Description */}
        <div>
          <label htmlFor="problem" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            What are you struggling with?
          </label>
          <textarea
            id="problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Describe your challenge or what you'd like help with..."
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-all duration-200 resize-none"
            rows={3}
            required
          />
        </div>

        {/* Category Selection */}
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            What type of challenge is this?
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as 'emotional' | 'mental' | 'physical')}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-all duration-200"
          >
            <option value="emotional">😊 Emotional (feelings, relationships, stress)</option>
            <option value="mental">🧠 Mental (thoughts, anxiety, focus, motivation)</option>
            <option value="physical">💪 Physical (sleep, energy, tension, health)</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!problem.trim() || isLoading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating Suggestions...
              </div>
            ) : (
              'Get Suggestions'
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
          💡 Our AI will analyze your situation and provide personalized, friendly suggestions with step-by-step guidance and explanations of why each approach helps.
        </p>
      </div>
    </div>
  );
}

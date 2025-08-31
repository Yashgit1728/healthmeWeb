import React, { useState, useEffect } from 'react';
import { 
  HeartIcon, 
  LightBulbIcon, 
  FlagIcon, 
  ExclamationTriangleIcon,
  UserGroupIcon,
  SparklesIcon,
  ChartBarIcon,
  EyeIcon,
  StarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { PROMPTS, getDailyPrompt, getPromptsByTheme, getRandomPrompt } from '../data/prompts';
import { Prompt, PromptTheme, PromptStats as PromptStatsType } from '../types/prompts';
import { PromptStats } from './PromptStats';
import { PromptResponseDisplay } from './PromptResponseDisplay';
import { generateHumanResponse } from '../utils/promptResponses';
import { Header } from './Header';

const themeIcons: Record<PromptTheme, React.ComponentType<any>> = {
  gratitude: HeartIcon,
  reflection: LightBulbIcon,
  goals: FlagIcon,
  stress: ExclamationTriangleIcon,
  relationships: UserGroupIcon,
  'self-care': SparklesIcon,
  growth: ChartBarIcon,
  mindfulness: EyeIcon
};

const themeColors: Record<PromptTheme, string> = {
  gratitude: 'bg-gradient-to-br from-pink-400 to-red-400',
  reflection: 'bg-gradient-to-br from-blue-400 to-indigo-400',
  goals: 'bg-gradient-to-br from-green-400 to-emerald-400',
  stress: 'bg-gradient-to-br from-orange-400 to-amber-400',
  relationships: 'bg-gradient-to-br from-purple-400 to-pink-400',
  'self-care': 'bg-gradient-to-br from-yellow-400 to-orange-400',
  growth: 'bg-gradient-to-br from-teal-400 to-cyan-400',
  mindfulness: 'bg-gradient-to-br from-indigo-400 to-purple-400'
};

const themeLabels: Record<PromptTheme, string> = {
  gratitude: 'Gratitude',
  reflection: 'Reflection',
  goals: 'Goals',
  stress: 'Stress',
  relationships: 'Relationships',
  'self-care': 'Self-Care',
  growth: 'Growth',
  mindfulness: 'Mindfulness'
};

export function DailyPrompts() {
  const [selectedTheme, setSelectedTheme] = useState<PromptTheme | 'all'>('all');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt>(getDailyPrompt());
  const [showResponse, setShowResponse] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [favoritePrompts, setFavoritePrompts] = useState<string[]>([]);
  const [completedPrompts, setCompletedPrompts] = useState<string[]>([]);
  const [showHumanResponse, setShowHumanResponse] = useState(false);
  const [humanResponse, setHumanResponse] = useState<any>(null);
  const [promptStats, setPromptStats] = useState<PromptStatsType>({
    totalPrompts: PROMPTS.length,
    completedPrompts: 0,
    favoriteThemes: [],
    streakDays: 0,
    lastCompletedDate: undefined
  });
  const [isDark, setIsDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Load user data from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoritePrompts');
    const savedCompleted = localStorage.getItem('completedPrompts');
    
    if (savedFavorites) {
      setFavoritePrompts(JSON.parse(savedFavorites));
    }
    if (savedCompleted) {
      setCompletedPrompts(JSON.parse(savedCompleted));
    }
  }, []);

  // Save user data to localStorage
  useEffect(() => {
    localStorage.setItem('favoritePrompts', JSON.stringify(favoritePrompts));
  }, [favoritePrompts]);

  useEffect(() => {
    localStorage.setItem('completedPrompts', JSON.stringify(completedPrompts));
  }, [completedPrompts]);

  // Update stats when favorites or completed prompts change
  useEffect(() => {
    const calculateStats = () => {
      // Calculate favorite themes
      const themeCounts: Record<string, number> = {};
      favoritePrompts.forEach(promptId => {
        const prompt = PROMPTS.find(p => p.id === promptId);
        if (prompt) {
          themeCounts[prompt.theme] = (themeCounts[prompt.theme] || 0) + 1;
        }
      });

      const favoriteThemes = Object.entries(themeCounts)
        .map(([theme, count]) => ({ theme: theme as PromptTheme, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate streak (simplified - just count consecutive days with completions)
      let streak = 0;
      const today = new Date();
      const responses = JSON.parse(localStorage.getItem('promptResponses') || '{}');
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const hasCompletion = Object.values(responses).some((response: any) => {
          if (response.completedAt) {
            const responseDate = response.completedAt.split('T')[0];
            return responseDate === dateStr;
          }
          return false;
        });
        
        if (hasCompletion) {
          streak++;
        } else {
          break;
        }
      }

      // Get last completed date
      const lastCompleted = Object.values(responses).find((response: any) => response.completedAt) as any;
      const lastCompletedDate = lastCompleted?.completedAt;

      setPromptStats({
        totalPrompts: PROMPTS.length,
        completedPrompts: completedPrompts.length,
        favoriteThemes,
        streakDays: streak,
        lastCompletedDate
      });
    };

    calculateStats();
  }, [favoritePrompts, completedPrompts]);

  const filteredPrompts = selectedTheme === 'all' 
    ? PROMPTS 
    : getPromptsByTheme(selectedTheme);

  const handleThemeSelect = (theme: PromptTheme | 'all') => {
    setSelectedTheme(theme);
    if (theme === 'all') {
      setCurrentPrompt(getDailyPrompt());
    } else {
      const themePrompts = getPromptsByTheme(theme);
      setCurrentPrompt(themePrompts[Math.floor(Math.random() * themePrompts.length)]);
    }
    setShowResponse(false);
    setUserResponse('');
  };

  const handleNewPrompt = () => {
    if (selectedTheme === 'all') {
      setCurrentPrompt(getRandomPrompt());
    } else {
      const themePrompts = getPromptsByTheme(selectedTheme);
      setCurrentPrompt(themePrompts[Math.floor(Math.random() * themePrompts.length)]);
    }
    setShowResponse(false);
    setUserResponse('');
  };

  const toggleFavorite = (promptId: string) => {
    setFavoritePrompts(prev => 
      prev.includes(promptId) 
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  };

  const handleComplete = () => {
    if (userResponse.trim()) {
      // Generate human-like response
      const response = generateHumanResponse(currentPrompt, userResponse);
      setHumanResponse(response);
      setShowHumanResponse(true);
      
      // Save response to localStorage
      const responses = JSON.parse(localStorage.getItem('promptResponses') || '{}');
      responses[currentPrompt.id] = {
        response: userResponse,
        completedAt: new Date().toISOString(),
        prompt: currentPrompt,
        aiResponse: response
      };
      localStorage.setItem('promptResponses', JSON.stringify(responses));
    }
  };

  const isFavorite = favoritePrompts.includes(currentPrompt.id);
  const isCompleted = completedPrompts.includes(currentPrompt.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header 
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Daily Prompts
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover thoughtful prompts to guide your journaling journey. 
            Choose a theme or let us surprise you with a daily reflection.
          </p>
        </div>

        {/* Theme Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Choose a Theme
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* All Themes Button */}
            <button
              onClick={() => handleThemeSelect('all')}
              className={`p-3 rounded-xl transition-all duration-200 ${
                selectedTheme === 'all'
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="text-center">
                <ArrowPathIcon className="h-6 w-6 mx-auto mb-1" />
                <span className="text-xs font-medium">All</span>
              </div>
            </button>

            {/* Theme Buttons */}
            {Object.entries(themeIcons).map(([theme, Icon]) => (
              <button
                key={theme}
                onClick={() => handleThemeSelect(theme as PromptTheme)}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  selectedTheme === theme
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <Icon className="h-6 w-6 mx-auto mb-1" />
                  <span className="text-xs font-medium">{themeLabels[theme as PromptTheme]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <PromptStats stats={promptStats} />
        </div>

        {/* Current Prompt Card */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            {showHumanResponse && humanResponse ? (
              <PromptResponseDisplay
                response={humanResponse}
                promptTheme={currentPrompt.theme}
                onContinue={() => {
                  setShowHumanResponse(false);
                  setShowResponse(false);
                  setUserResponse('');
                  setHumanResponse(null);
                }}
              />
            ) : (
              <>
                {/* Prompt Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${themeColors[currentPrompt.theme]} text-white`}>
                  {React.createElement(themeIcons[currentPrompt.theme], { className: 'h-6 w-6' })}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {themeLabels[currentPrompt.theme]}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="capitalize">{currentPrompt.category}</span>
                    <span>•</span>
                    <span className="capitalize">{currentPrompt.difficulty}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleFavorite(currentPrompt.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isFavorite
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <StarIcon className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleNewPrompt}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  title="Get new prompt"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Prompt Text */}
            <div className="mb-6">
              <p className="text-2xl font-medium text-gray-900 dark:text-white leading-relaxed">
                {currentPrompt.text}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {currentPrompt.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Response Section */}
            {!showResponse ? (
              <button
                onClick={() => setShowResponse(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Start Writing
              </button>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="Write your thoughts here..."
                  className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowResponse(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!userResponse.trim()}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      userResponse.trim()
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? 'Completed ✓' : 'Complete'}
                  </button>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>

        {/* Prompt Browser */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Explore More Prompts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrompts.slice(0, 9).map(prompt => (
              <div
                key={prompt.id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  prompt.id === currentPrompt.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  setCurrentPrompt(prompt);
                  setShowResponse(false);
                  setUserResponse('');
                  setShowHumanResponse(false);
                  setHumanResponse(null);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${themeColors[prompt.theme]} text-white`}>
                    {React.createElement(themeIcons[prompt.theme], { className: 'h-4 w-4' })}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(prompt.id);
                    }}
                    className={`p-1 rounded ${
                      favoritePrompts.includes(prompt.id)
                        ? 'text-red-500'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <StarIcon className={`h-4 w-4 ${favoritePrompts.includes(prompt.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">
                  {prompt.text}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="capitalize">{prompt.theme}</span>
                  <span className="capitalize">{prompt.difficulty}</span>
                </div>
                {completedPrompts.includes(prompt.id) && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Completed
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  HeartIcon, 
  LightBulbIcon, 
  SparklesIcon, 
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { PromptResponse } from '../utils/promptResponses';

interface PromptResponseDisplayProps {
  response: PromptResponse;
  promptTheme: string;
  onContinue?: () => void;
  className?: string;
}

const themeIcons = {
  gratitude: HeartIcon,
  reflection: LightBulbIcon,
  goals: SparklesIcon,
  stress: LightBulbIcon,
  relationships: HeartIcon,
  'self-care': SparklesIcon,
  growth: LightBulbIcon,
  mindfulness: LightBulbIcon
};

const themeColors = {
  gratitude: 'from-pink-400 to-red-400',
  reflection: 'from-blue-400 to-indigo-400',
  goals: 'from-green-400 to-emerald-400',
  stress: 'from-orange-400 to-amber-400',
  relationships: 'from-purple-400 to-pink-400',
  'self-care': 'from-yellow-400 to-orange-400',
  growth: 'from-teal-400 to-cyan-400',
  mindfulness: 'from-indigo-400 to-purple-400'
};

export function PromptResponseDisplay({ 
  response, 
  promptTheme, 
  onContinue,
  className = '' 
}: PromptResponseDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);

  useEffect(() => {
    // Animate in the response
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Show insight after a delay
      const insightTimer = setTimeout(() => setShowInsight(true), 800);
      // Show encouragement after insight
      const encouragementTimer = setTimeout(() => setShowEncouragement(true), 1600);
      
      return () => {
        clearTimeout(insightTimer);
        clearTimeout(encouragementTimer);
      };
    }
  }, [isVisible]);

  const Icon = themeIcons[promptTheme as keyof typeof themeIcons] || LightBulbIcon;
  const gradientColors = themeColors[promptTheme as keyof typeof themeColors] || 'from-blue-400 to-indigo-400';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Response Message */}
      <div 
        className={`transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientColors} text-white flex-shrink-0`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-lg text-gray-900 dark:text-white leading-relaxed">
                {response.message}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Insight */}
      {showInsight && (
        <div 
          className={`transform transition-all duration-700 ease-out ${
            showInsight ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center space-x-3 mb-3">
              <LightBulbIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide">
                Personal Insight
              </h4>
            </div>
            <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
              {response.insight}
            </p>
          </div>
        </div>
      )}

      {/* Follow-up Question */}
      <div 
        className={`transform transition-all duration-700 ease-out delay-300 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center space-x-3 mb-3">
            <ArrowRightIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200 uppercase tracking-wide">
              Continue Your Reflection
            </h4>
          </div>
          <p className="text-purple-900 dark:text-purple-100 text-lg font-medium leading-relaxed">
            {response.followUpQuestion}
          </p>
        </div>
      </div>

      {/* Encouragement */}
      {showEncouragement && (
        <div 
          className={`transform transition-all duration-700 ease-out ${
            showEncouragement ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800">
            <div className="flex items-center space-x-3 mb-3">
              <SparklesIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 uppercase tracking-wide">
                Encouragement
              </h4>
            </div>
            <p className="text-green-900 dark:text-green-100 leading-relaxed">
              {response.encouragement}
            </p>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div 
        className={`transform transition-all duration-700 ease-out delay-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="text-center">
          <button
            onClick={onContinue}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <CheckCircleIcon className="h-5 w-5" />
            <span>Continue Your Journey</span>
          </button>
        </div>
      </div>

      {/* Celebration Animation */}
      {showEncouragement && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-ping">
              <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

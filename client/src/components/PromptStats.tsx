import { 
  StarIcon, 
  CalendarIcon 
} from '@heroicons/react/24/outline';
import { PromptStats as PromptStatsType } from '../types/prompts';

interface PromptStatsProps {
  stats: PromptStatsType;
  className?: string;
}

export function PromptStats({ stats, className = '' }: PromptStatsProps) {
  const completionRate = stats.totalPrompts > 0 
    ? Math.round((stats.completedPrompts / stats.totalPrompts) * 100) 
    : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Your Progress
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Prompts */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalPrompts}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Prompts
          </div>
        </div>

        {/* Completed Prompts */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.completedPrompts}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Completed
          </div>
        </div>

        {/* Completion Rate */}
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {completionRate}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Completion Rate
          </div>
        </div>

        {/* Streak */}
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.streakDays}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Day Streak
          </div>
        </div>
      </div>

      {/* Favorite Themes */}
      {stats.favoriteThemes.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Favorite Themes
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.favoriteThemes.slice(0, 3).map((theme) => (
              <div
                key={theme.theme}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
              >
                <StarIcon className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {theme.theme}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({theme.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Completed */}
      {stats.lastCompletedDate && (
        <div className="mt-4 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Last completed: {new Date(stats.lastCompletedDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

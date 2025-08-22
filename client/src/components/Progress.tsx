import React, { useState, useEffect } from 'react';
import { ChartBarIcon, HashtagIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { useStats } from '../api/hooks';
import { Header } from './Header';

// Helper to format dates consistently
const toShortDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return dateStr;
  }
};

export function Progress() {
  // All hooks at the top, always called
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const { data: stats, isLoading, error } = useStats(range);

  // Update theme when it changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Safe data extraction (no hooks, just variables)
  const reflectionsCount = stats?.reflectionsCount ?? 0;
  const avgMood = Number.isFinite(stats?.avgMood) ? (stats?.avgMood ?? 0) : 0;
  const byDay = Array.isArray(stats?.byDay) ? stats.byDay : [];
  const tags = Array.isArray(stats?.tags) ? stats.tags : [];

  // Compute derived values (no hooks)
  const streak = (() => {
    let s = 0;
    for (let i = byDay.length - 1; i >= 0; i--) {
      if ((byDay[i]?.count ?? 0) > 0) s++; else break;
    }
    return s;
  })();

  const maxTagCount = (() => {
    if (!tags.length) return 1;
    const m = tags.reduce((acc, t) => Math.max(acc, Number.isFinite(t.count) ? t.count : 0), 0);
    return m || 1;
  })();

  const moodTrendData = byDay.map(d => ({
    date: toShortDate(d.date),
    avgMood: Number.isFinite(d.avgMood) ? (d.avgMood ?? 0) : 0
  }));

  const reflectionsData = byDay.map(d => ({
    date: toShortDate(d.date),
    count: Number.isFinite(d.count) ? (d.count ?? 0) : 0
  }));

  const hasAnyData = reflectionsCount > 0 || byDay.length > 0;

  const mainContent = (() => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      );
    }

    if (error || !hasAnyData) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6 space-y-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No Data Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm">
            Start journaling to see your progress and insights here. Your reflections will help build a meaningful overview of your journey.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Range Selector */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Progress
          </h2>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setRange('7d')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                range === '7d'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                range === '30d'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={<SparklesIcon className="w-6 h-6" />}
            label="Reflections"
            value={reflectionsCount.toString()}
            color="text-blue-500"
          />
          <StatCard
            icon={<ChartBarIcon className="w-6 h-6" />}
            label="Average Mood"
            value={avgMood.toFixed(1)}
            color="text-purple-500"
          />
          <StatCard
            icon={<HashtagIcon className="w-6 h-6" />}
            label="Tags Used"
            value={tags.length.toString()}
            color="text-green-500"
          />
          <StatCard
            icon={<span className="text-xl">🔥</span>}
            label="Current Streak"
            value={`${streak} day${streak === 1 ? '' : 's'}`}
            color="text-orange-500"
          />
        </div>

        {/* Mood Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Mood Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false}
                  tick={{ fill: isDark ? '#9CA3AF' : '#4B5563' }}
                />
                <YAxis 
                  domain={[0, 10]} 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  tickCount={6}
                  tick={{ fill: isDark ? '#9CA3AF' : '#4B5563' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    borderRadius: '0.5rem',
                    color: isDark ? '#D1D5DB' : '#4B5563'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="avgMood" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: isDark ? '#6366f1' : '#4F46E5' }} 
                  activeDot={{ r: 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Reflections (Count) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Daily Reflections</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reflectionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false}
                  tick={{ fill: isDark ? '#9CA3AF' : '#4B5563' }}
                />
                <YAxis 
                  allowDecimals={false} 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false}
                  tick={{ fill: isDark ? '#9CA3AF' : '#4B5563' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    borderRadius: '0.5rem',
                    color: isDark ? '#D1D5DB' : '#4B5563'
                  }} 
                />
                <Bar dataKey="count" fill={isDark ? '#3B82F6' : '#60A5FA'} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Practice Breakdown */}
        {tags.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Practice Breakdown</h3>
            <div className="space-y-3">
              {tags.slice(0, 10).map(({ tag, count = 0 }) => {
                const safeCount = Number.isFinite(count) ? count : 0;
                const width = `${Math.max(10, Math.round((safeCount / maxTagCount) * 100))}%`;
                return (
                  <div key={tag} className="flex items-center gap-3">
                    <div className="w-28 text-sm text-gray-700 dark:text-gray-300 truncate">#{tag}</div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-3 bg-blue-500 dark:bg-blue-400" style={{ width }} />
                      </div>
                    </div>
                    <div className="w-10 text-right text-sm text-gray-600 dark:text-gray-400">{safeCount}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Header 
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
      />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {mainContent}
      </main>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {label}
      </div>
    </div>
  );
}
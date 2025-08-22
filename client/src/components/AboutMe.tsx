import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Header } from './Header';

interface ProfileUpdate {
  name: string;
  timezone: string;
  goals: string;
}

const defaultFormData: ProfileUpdate = {
  name: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  goals: ''
};

export function AboutMe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDark, setIsDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [formData, setFormData] = useState<ProfileUpdate>(defaultFormData);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        timezone: user.timezone || defaultFormData.timezone,
        goals: user.goals || ''
      });
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      const response = await api.put('/api/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header 
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
      />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            About Me
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={formData.timezone}
                readOnly
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Goals
              </label>
              <textarea
                value={formData.goals}
                onChange={e => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 min-h-[100px]"
                placeholder="What would you like to focus on in your wellness journey?"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </button>

            {updateProfile.isSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                Profile updated successfully
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
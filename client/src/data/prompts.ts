import { Prompt } from '../types/prompts';

export const PROMPTS: Prompt[] = [
  // Gratitude Theme
  {
    id: 'gratitude-1',
    text: "What made you smile today?",
    theme: 'gratitude',
    category: 'daily',
    difficulty: 'easy',
    tags: ['gratitude', 'daily', 'positive'],
    createdAt: '2024-01-01'
  },
  {
    id: 'gratitude-2',
    text: "Name three things you're grateful for right now, no matter how small.",
    theme: 'gratitude',
    category: 'daily',
    difficulty: 'easy',
    tags: ['gratitude', 'daily', 'counting'],
    createdAt: '2024-01-01'
  },
  {
    id: 'gratitude-3',
    text: "Who made a positive impact on your life this week? What did they do?",
    theme: 'gratitude',
    category: 'weekly',
    difficulty: 'medium',
    tags: ['gratitude', 'weekly', 'relationships'],
    createdAt: '2024-01-01'
  },

  // Reflection Theme
  {
    id: 'reflection-1',
    text: "What's one challenge you faced today and how did you handle it?",
    theme: 'reflection',
    category: 'daily',
    difficulty: 'medium',
    tags: ['reflection', 'daily', 'challenges'],
    createdAt: '2024-01-01'
  },
  {
    id: 'reflection-2',
    text: "What's something you learned about yourself this week?",
    theme: 'reflection',
    category: 'weekly',
    difficulty: 'medium',
    tags: ['reflection', 'weekly', 'self-awareness'],
    createdAt: '2024-01-01'
  },
  {
    id: 'reflection-3',
    text: "If you could give advice to yourself from a year ago, what would you say?",
    theme: 'reflection',
    category: 'monthly',
    difficulty: 'challenging',
    tags: ['reflection', 'monthly', 'growth'],
    createdAt: '2024-01-01'
  },

  // Goals Theme
  {
    id: 'goals-1',
    text: "What's one small step you can take today toward a bigger goal?",
    theme: 'goals',
    category: 'daily',
    difficulty: 'easy',
    tags: ['goals', 'daily', 'action'],
    createdAt: '2024-01-01'
  },
  {
    id: 'goals-2',
    text: "What would you like to accomplish by the end of this month?",
    theme: 'goals',
    category: 'monthly',
    difficulty: 'medium',
    tags: ['goals', 'monthly', 'planning'],
    createdAt: '2024-01-01'
  },
  {
    id: 'goals-3',
    text: "What's a dream you've been putting off? What's holding you back?",
    theme: 'goals',
    category: 'monthly',
    difficulty: 'challenging',
    tags: ['goals', 'monthly', 'dreams'],
    createdAt: '2024-01-01'
  },

  // Stress Theme
  {
    id: 'stress-1',
    text: "What's one thing that's been stressing you out lately?",
    theme: 'stress',
    category: 'daily',
    difficulty: 'easy',
    tags: ['stress', 'daily', 'awareness'],
    createdAt: '2024-01-01'
  },
  {
    id: 'stress-2',
    text: "When you're feeling overwhelmed, what helps you feel more grounded?",
    theme: 'stress',
    category: 'weekly',
    difficulty: 'medium',
    tags: ['stress', 'weekly', 'coping'],
    createdAt: '2024-01-01'
  },
  {
    id: 'stress-3',
    text: "What's a stressful situation you handled well recently? What made it successful?",
    theme: 'stress',
    category: 'weekly',
    difficulty: 'challenging',
    tags: ['stress', 'weekly', 'success'],
    createdAt: '2024-01-01'
  },

  // Relationships Theme
  {
    id: 'relationships-1',
    text: "Who did you connect with today? How did it make you feel?",
    theme: 'relationships',
    category: 'daily',
    difficulty: 'easy',
    tags: ['relationships', 'daily', 'connection'],
    createdAt: '2024-01-01'
  },
  {
    id: 'relationships-2',
    text: "What's a relationship in your life that could use more attention?",
    theme: 'relationships',
    category: 'weekly',
    difficulty: 'medium',
    tags: ['relationships', 'weekly', 'attention'],
    createdAt: '2024-01-01'
  },
  {
    id: 'relationships-3',
    text: "What's something you'd like to improve about how you communicate with others?",
    theme: 'relationships',
    category: 'monthly',
    difficulty: 'challenging',
    tags: ['relationships', 'monthly', 'communication'],
    createdAt: '2024-01-01'
  },

  // Self-Care Theme
  {
    id: 'selfcare-1',
    text: "What's one thing you can do today to take care of yourself?",
    theme: 'self-care',
    category: 'daily',
    difficulty: 'easy',
    tags: ['self-care', 'daily', 'wellness'],
    createdAt: '2024-01-01'
  },
  {
    id: 'selfcare-2',
    text: "What activity makes you lose track of time? When was the last time you did it?",
    theme: 'self-care',
    category: 'weekly',
    difficulty: 'medium',
    tags: ['self-care', 'weekly', 'flow'],
    createdAt: '2024-01-01'
  },
  {
    id: 'selfcare-3',
    text: "What boundaries do you need to set to protect your energy?",
    theme: 'self-care',
    category: 'monthly',
    difficulty: 'challenging',
    tags: ['self-care', 'monthly', 'boundaries'],
    createdAt: '2024-01-01'
  },

  // Growth Theme
  {
    id: 'growth-1',
    text: "What's a skill you'd like to develop? What's the first step?",
    theme: 'growth',
    category: 'weekly',
    difficulty: 'medium',
    tags: ['growth', 'weekly', 'skills'],
    createdAt: '2024-01-01'
  },
  {
    id: 'growth-2',
    text: "What's a mistake you made recently? What did you learn from it?",
    theme: 'growth',
    category: 'weekly',
    difficulty: 'medium',
    tags: ['growth', 'weekly', 'learning'],
    createdAt: '2024-01-01'
  },
  {
    id: 'growth-3',
    text: "What's something you used to believe that you no longer believe? What changed?",
    theme: 'growth',
    category: 'monthly',
    difficulty: 'challenging',
    tags: ['growth', 'monthly', 'beliefs'],
    createdAt: '2024-01-01'
  },

  // Mindfulness Theme
  {
    id: 'mindfulness-1',
    text: "What's one thing you noticed today that you usually overlook?",
    theme: 'mindfulness',
    category: 'daily',
    difficulty: 'easy',
    tags: ['mindfulness', 'daily', 'awareness'],
    createdAt: '2024-01-01'
  },
  {
    id: 'mindfulness-2',
    text: "How did your body feel today? Any tension or relaxation you noticed?",
    theme: 'mindfulness',
    category: 'daily',
    difficulty: 'medium',
    tags: ['mindfulness', 'daily', 'body'],
    createdAt: '2024-01-01'
  },
  {
    id: 'mindfulness-3',
    text: "What thoughts kept coming back to you today? How did you respond to them?",
    theme: 'mindfulness',
    category: 'weekly',
    difficulty: 'challenging',
    tags: ['mindfulness', 'weekly', 'thoughts'],
    createdAt: '2024-01-01'
  }
];

// Helper function to get prompts by theme
export const getPromptsByTheme = (theme: string): Prompt[] => {
  return PROMPTS.filter(prompt => prompt.theme === theme);
};

// Helper function to get random prompt
export const getRandomPrompt = (): Prompt => {
  const randomIndex = Math.floor(Math.random() * PROMPTS.length);
  return PROMPTS[randomIndex];
};

// Helper function to get daily prompt (based on date for consistency)
export const getDailyPrompt = (): Prompt => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % PROMPTS.length;
  return PROMPTS[index];
};

// Helper function to get prompts by difficulty
export const getPromptsByDifficulty = (difficulty: 'easy' | 'medium' | 'challenging'): Prompt[] => {
  return PROMPTS.filter(prompt => prompt.difficulty === difficulty);
};

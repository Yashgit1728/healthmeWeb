export interface Prompt {
  id: string;
  text: string;
  theme: PromptTheme;
  category: PromptCategory;
  difficulty: 'easy' | 'medium' | 'challenging';
  tags: string[];
  createdAt: string;
}

export type PromptTheme = 
  | 'gratitude' 
  | 'reflection' 
  | 'goals' 
  | 'stress' 
  | 'relationships' 
  | 'self-care' 
  | 'growth' 
  | 'mindfulness';

export type PromptCategory = 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'seasonal';

export interface UserPromptInteraction {
  id: string;
  userId: string;
  promptId: string;
  response: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface PromptStats {
  totalPrompts: number;
  completedPrompts: number;
  favoriteThemes: Array<{ theme: PromptTheme; count: number }>;
  streakDays: number;
  lastCompletedDate?: string;
}

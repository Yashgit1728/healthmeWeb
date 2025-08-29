import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './axios';

export interface Reflection {
  id: string;
  userId: string;
  text: string;
  mood: number;
  tags: string[];
  createdAt: string;
}

export interface Stats {
  reflectionsCount: number;
  avgMood: number;
  tags: Array<{ tag: string; count: number }>;
  byDay: Array<{ date: string; count: number; avgMood: number }>;
}

// Support both old and new AI response formats
export interface AIResponse {
  // New format
  response?: string;
  chips?: string[];
  
  // Old format (for backward compatibility)
  acknowledge?: string;
  reflect?: string;
  suggest?: string;
  followUp?: string;
}

interface ReflectionResponse {
  reflection: Reflection;
  ai: AIResponse;
  stats: Stats;
}

export function useStats(range: '7d' | '30d') {
  return useQuery<Stats>({
    queryKey: ['stats', range],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/stats?range=${range}`);
        return data;
      } catch (error) {
        console.error('Stats fetch error:', error);
        throw error;
      }
    },
    staleTime: 30000,
    retry: 2
  });
}

export function useReflections() {
  return useQuery<Reflection[]>({
    queryKey: ['reflections'],
    queryFn: async () => {
      const { data } = await api.get('/reflections');
      return data;
    },
    staleTime: 30000
  });
}

interface CreateReflectionData {
  text: string;
  mood: number;
  tags: string[];
}

export function useCreateReflection() {
  const queryClient = useQueryClient();
  
  return useMutation<ReflectionResponse, Error, CreateReflectionData>({
    mutationFn: async (data) => {
      const response = await api.post('/reflections', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update stats directly instead of invalidating
      queryClient.setQueryData(['stats', '7d'], data.stats);
      queryClient.setQueryData(['stats', '30d'], data.stats);
      
      // Update reflections list
      queryClient.setQueryData<Reflection[]>(['reflections'], (old = []) => {
        return [...old, data.reflection];
      });
    }
  });
}
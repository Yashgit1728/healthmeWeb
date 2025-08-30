import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';

export interface User {
  id: string;
  email: string;
  name: string;
  timezone?: string;
  goals?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Set the token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const response = await api.get<User>('/auth/me');
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // Clear invalid token
          localStorage.removeItem('authToken');
          delete api.defaults.headers.common['Authorization'];
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
      
      // Store token
      localStorage.setItem('authToken', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Set user data immediately
      queryClient.setQueryData(['me'], response.data.user);
      
      // Small delay to let browser detect successful login and offer to save password
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to app
      navigate('/app');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to sign in');
      }
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Register the user
      const response = await api.post('/auth/register', { name, email, password });
      
      // Small delay to let browser detect successful form submission
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // If registration returns user data (auto-login), set it and go to app
      if (response.data && response.data.id) {
        queryClient.setQueryData(['me'], response.data);
        navigate('/app');
      } else {
        // Otherwise go to sign in with success message
        navigate('/signin', { state: { registered: true } });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to register');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear token and local state
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
      navigate('/signin');
    }
  };

  const value = {
    user: user ?? null,
    isLoading,
    error: error as Error | null,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
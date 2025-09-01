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
        const token = localStorage.getItem('authToken');
        if (!token) {
          return null;
        }
        
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
    refetchOnMount: true, // Changed to true to refetch on mount
    enabled: !!localStorage.getItem('authToken') // Only run if we have a token
  });

  // Handle errors separately
  useEffect(() => {
    if (error) {
      console.error('Auth query error:', error);
      // Clear invalid token on any error
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [error]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
      
      console.log('✅ Login successful, token received:', {
        tokenLength: response.data.token.length,
        tokenStart: response.data.token.substring(0, 10) + '...',
        userId: response.data.user.id
      });
      
      // Store token
      localStorage.setItem('authToken', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Set user data immediately
      queryClient.setQueryData(['me'], response.data.user);
      
      // Navigate to app
      navigate('/app');
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 'Failed to sign in';
        const errorCode = error.response?.data?.code;
        
        console.error('Login error details:', {
          status: error.response?.status,
          error: errorMessage,
          code: errorCode,
          responseData: error.response?.data
        });
        
        // Handle specific error codes
        if (errorCode === 'TOKEN_EXPIRED') {
          throw new Error('Your session has expired. Please sign in again.');
        } else if (errorCode === 'INVALID_TOKEN') {
          throw new Error('Authentication error. Please try signing in again.');
        } else if (error.response?.status === 401) {
          throw new Error('Invalid email or password. Please check your credentials.');
        } else {
          throw new Error(errorMessage);
        }
      }
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Register the user
      const response = await api.post<{ user: User; token: string }>('/auth/register', { name, email, password });
      
      // Store token and user data
      localStorage.setItem('authToken', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      queryClient.setQueryData(['me'], response.data.user);
      
      // Navigate to app
      navigate('/app');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to register');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Attempting logout...');
      
      // Clear token and local state first
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
      
      // Then call server logout
      await api.post('/auth/logout');
      
      console.log('✅ Logout successful');
      
      // Navigate to signin
      navigate('/signin');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      
      // Even if server logout fails, ensure local cleanup
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
      navigate('/signin');
    }
  };

  const value: AuthContextType = {
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
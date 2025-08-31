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

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        // Try to get user data from the /me endpoint
        const response = await api.get<User>('/auth/me');
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // User is not authenticated, return null
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Handle errors separately
  useEffect(() => {
    if (error) {
      console.error('Auth query error:', error);
      // Clear user data on any error
      queryClient.setQueryData(['me'], null);
    }
  }, [error, queryClient]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await api.post<{ user: User }>('/auth/login', { email, password });
      
      console.log('✅ Login successful, user data received:', {
        userId: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.name
      });
      
      // No need to store token - it's now in httpOnly cookie
      // Just set user data
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
        } else if (errorCode === 'INVALID_CREDENTIALS') {
          throw new Error('Invalid email or password. Please check your credentials.');
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
      console.log('📝 Attempting registration for:', email);
      
      // Register the user
      const response = await api.post<{ user: User }>('/auth/register', { name, email, password });
      
      console.log('✅ Registration successful, user data received:', {
        userId: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.name
      });
      
      // No need to store token - it's now in httpOnly cookie
      // Just set user data
      queryClient.setQueryData(['me'], response.data.user);
      
      // Navigate to app
      navigate('/app');
    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to register');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Attempting logout...');
      
      // Clear local state first
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
      
      // Then call server logout (this will clear the cookie)
      await api.post('/auth/logout');
      
      console.log('✅ Logout successful');
      
      // Navigate to signin
      navigate('/signin');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      
      // Even if server logout fails, ensure local cleanup
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
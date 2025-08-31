import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { JournalApp } from './components/JournalApp';
import { Progress } from './components/Progress';
import { AboutMe } from './components/AboutMe';
import { LandingPage } from './components/LandingPage';
import { DailyPrompts } from './components/DailyPrompts';

// Configure query client with better error handling and caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error instanceof Error && 'status' in error && (error.status === 401 || error.status === 403)) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // Cache persists for 30 minutes
    },
    mutations: {
      retry: false, // Don't retry mutations
    }
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <JournalApp />
              </ProtectedRoute>
            } />
            <Route path="/prompts" element={
              <ProtectedRoute>
                <DailyPrompts />
              </ProtectedRoute>
            } />
            <Route path="/about" element={
              <ProtectedRoute>
                <AboutMe />
              </ProtectedRoute>
            } />
            <Route path="/progress" element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            } />

            {/* Catch all route - redirect to appropriate page */}
            <Route path="*" element={
              <ProtectedRoute>
                <JournalApp />
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
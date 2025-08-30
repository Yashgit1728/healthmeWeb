import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Header } from './Header';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LocationState {
  registered?: boolean;
}

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDark, setIsDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Show success message if redirected from signup
  const showSuccess = (location.state as LocationState)?.registered;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validData = loginSchema.parse(formData);
      
      // Call login and wait for success
      await login(validData.email, validData.password);
      
      // If we get here, login was successful
      // The browser should now offer to save the password
      console.log('Login successful - browser should offer to save password');
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          const path = issue.path[0];
          if (typeof path === 'string') {
            fieldErrors[path] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setErrors({
          form: error.message
        });
      } else {
        setErrors({
          form: 'An unexpected error occurred'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header 
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
      />
      <main className="flex items-center justify-center px-4 py-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Sign In</h2>
          
          {showSuccess && (
            <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-lg text-sm">
              Account created successfully. Please sign in.
            </div>
          )}

          <form 
            onSubmit={handleSubmit} 
            className="space-y-4" 
            autoComplete="on"
            method="post"
            action="/auth/login"
          >
            {errors.form && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {errors.form}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                name="username"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="you@example.com"
                autoComplete="username"
                required
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              Sign Up
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
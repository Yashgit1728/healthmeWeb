import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Header } from './Header';
import api from '../api/axios';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isDark, setIsDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    setSuccessMessage('');

    try {
      const validData = forgotPasswordSchema.parse(formData);
      
      // Call the forgot password API using the configured axios instance
      const response = await api.post('/auth/forgot-password', { 
        email: validData.email 
      });

      if (response.status === 200) {
        setIsSuccess(true);
        
        // Check for debug header to determine the actual result
        const debugHeader = response.headers['x-reset-debug'];
        if (debugHeader) {
          switch (debugHeader) {
            case 'unknown_email':
              setSuccessMessage('This email address is not registered with us.');
              break;
            case 'email_sent':
              setSuccessMessage('Password reset link has been sent to your email.');
              break;
            case 'email_failed':
              setSuccessMessage('We encountered an issue sending the email. Please try again later.');
              break;
            case 'db_error':
              setSuccessMessage('We encountered a technical issue. Please try again later.');
              break;
            default:
              setSuccessMessage('If that email exists, we\'ve sent a reset link.');
          }
        } else {
          // Fallback message if debug header is not available
          setSuccessMessage('If that email exists, we\'ve sent a reset link.');
        }
      } else {
        setErrors({
          form: response.data?.error || 'Failed to send reset email'
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          const path = issue.path[0];
          if (typeof path === 'string') {
            fieldErrors[path] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error.response?.data?.error) {
        setErrors({
          form: error.response.data.error
        });
      } else if (error.message) {
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Header 
          isDark={isDark}
          onThemeToggle={() => setIsDark(!isDark)}
        />
        <main className="flex items-center justify-center px-4 py-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
            {/* Show different icons based on the message */}
            {successMessage.includes('not registered') ? (
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            ) : successMessage.includes('sent') ? (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {successMessage.includes('not registered') ? 'Email Not Found' : 'Check Your Email'}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {successMessage}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/signin')}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Back to Sign In
              </button>
              
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setFormData({ email: '' });
                  setSuccessMessage('');
                }}
                className="w-full py-2 px-4 text-blue-500 hover:text-blue-600 transition-colors"
              >
                Try Another Email
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header 
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
      />
      <main className="flex items-center justify-center px-4 py-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Reset Password</h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {errors.form}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/signin')}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

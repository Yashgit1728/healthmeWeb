import React, { useState, useRef } from 'react';
import { useCreateReflection } from '../api/hooks';
import { ChatContainer } from './ChatContainer';
import { JournalInput } from './JournalInput';
import { useSuggestions } from '../api/hooks';
import { Header } from './Header';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  suggestions?: {
    suggestions: Array<{
      title: string;
      description: string;
      steps: string[];
      whyItHelps: string;
    }>;
    summary: string;
    category: string;
  };
}

export function JournalApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const createReflection = useCreateReflection();
  const suggestionsMutation = useSuggestions();

  // Theme state
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Update theme when it changes
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Listen for system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle suggestions from the Get Tips button
  const handleGetTips = async (text: string) => {
    try {
      // Analyze the text to determine category and generate suggestions
      const category = determineCategory(text);
      const result = await suggestionsMutation.mutateAsync({ problem: text, category });
      
      // Add AI suggestions as a response
      const suggestionsMessage: Message = {
        id: Date.now().toString(),
        content: `Based on what you shared, here are some helpful tips for your ${category} well-being:`,
        isUser: false,
        timestamp: new Date(),
        suggestions: result
      };
      
      setMessages(prev => [...prev, suggestionsMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to get tips:', error);
    }
  };

  // Determine category based on text content
  const determineCategory = (text: string): 'emotional' | 'mental' | 'physical' => {
    const lowerText = text.toLowerCase();
    
    // Emotional indicators
    if (lowerText.includes('feel') || lowerText.includes('sad') || lowerText.includes('happy') || 
        lowerText.includes('angry') || lowerText.includes('love') || lowerText.includes('relationship') ||
        lowerText.includes('family') || lowerText.includes('friend') || lowerText.includes('lonely')) {
      return 'emotional';
    }
    
    // Mental indicators
    if (lowerText.includes('think') || lowerText.includes('worry') || lowerText.includes('anxiety') ||
        lowerText.includes('stress') || lowerText.includes('focus') || lowerText.includes('mind') ||
        lowerText.includes('thought') || lowerText.includes('memory') || lowerText.includes('decision')) {
      return 'mental';
    }
    
    // Physical indicators
    if (lowerText.includes('sleep') || lowerText.includes('tired') || lowerText.includes('energy') ||
        lowerText.includes('pain') || lowerText.includes('body') || lowerText.includes('exercise') ||
        lowerText.includes('health') || lowerText.includes('sick') || lowerText.includes('tension')) {
      return 'physical';
    }
    
    // Default to emotional if unclear
    return 'emotional';
  };

  // Listen for suggestions requests from the Get Tips button
  React.useEffect(() => {
    const handleSuggestionsRequest = (event: CustomEvent) => {
      handleGetTips(event.detail.text);
    };

    window.addEventListener('requestSuggestions', handleSuggestionsRequest as EventListener);
    return () => {
      window.removeEventListener('requestSuggestions', handleSuggestionsRequest as EventListener);
    };
  }, []);

  // Handle new reflection submission
  const handleSubmitReflection = async (data: { text: string; mood: number; tags: string[] }) => {
    try {
      console.log('Submitting reflection:', data);
      const result = await createReflection.mutateAsync(data);
      console.log('Reflection result:', result);
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: data.text,
        isUser: true,
        timestamp: new Date()
      };
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.ai?.response || "I hear you and appreciate you sharing your thoughts with me.",
        isUser: false,
        timestamp: new Date()
      };
      
      console.log('Adding messages:', { userMessage, aiMessage });
      setMessages(prev => {
        const newMessages = [...prev, userMessage, aiMessage];
        console.log('Updated messages:', newMessages);
        return newMessages;
      });
      
      // Scroll to bottom
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to submit reflection:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Header 
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
      />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Single Column - Journal Chat with Integrated Suggestions */}
        <div className="space-y-6">
          {/* Chat Container */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Journal Chat 💬
              </h3>
            </div>
            <div className="h-[600px] overflow-hidden">
              <ChatContainer 
                messages={messages}
                containerRef={containerRef}
              />
            </div>
          </div>
          
          {/* Journal Input */}
          <JournalInput 
            onSubmit={handleSubmitReflection}
            isLoading={createReflection.isPending}
          />
        </div>
      </main>
    </div>
  );
}
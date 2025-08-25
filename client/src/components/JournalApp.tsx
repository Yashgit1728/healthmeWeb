import React from 'react';
import { useCreateReflection } from '../api/hooks';
import { Header } from './Header';
import { JournalInput } from './JournalInput';
import { ChatContainer } from './ChatContainer';
import { Progress } from './Progress';
import { useLocation } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface JournalAppProps {
  defaultTab?: 'journal' | 'progress';
}

export function JournalApp({ defaultTab = 'journal' }: JournalAppProps) {
  const location = useLocation();
  const [messages, setMessages] = React.useState<Message[]>([]);
  
  // Theme state
  const [isDark, setIsDark] = React.useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
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

  // Determine if we're on the progress page
  const isProgressPage = defaultTab === 'progress' || location.pathname === '/progress';

  // Use the optimized reflection mutation
  const reflection = useCreateReflection();

  const handleSubmit = (data: { text: string; mood: number; tags: string[] }) => {
    if (!data.text.trim()) return;
    
    console.log('Submitting reflection:', data);
    
    // Immediately add user message
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        content: data.text,
        isUser: true,
        timestamp: new Date(),
      },
    ]);

    // Add typing indicator
    const typingId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      {
        id: typingId,
        content: '',
        isUser: false,
        timestamp: new Date(),
        isTyping: true
      }
    ]);

    // Send reflection and get AI response
    reflection.mutate(
      { 
        text: data.text,
        mood: data.mood,
        tags: data.tags
      },
      {
        onSuccess: (responseData) => {
          console.log('Reflection submitted successfully:', responseData);
          
          let aiContent: string;
          
          if (responseData.ai && responseData.ai.response) {
            // Parse the AI response
            const parts = responseData.ai.response.split('\n').filter(part => part.trim());
            aiContent = parts.join(' ');
          } else {
            // Fallback
            aiContent = "I hear you and appreciate you sharing your thoughts with me.";
          }
          
          console.log('Processed AI content:', aiContent);
          
          // Remove typing indicator and add AI response
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== typingId);
            return [
              ...filtered,
              {
                id: Date.now().toString(),
                content: aiContent,
                isUser: false,
                timestamp: new Date()
              }
            ];
          });
        },
        onError: (error) => {
          console.error('Reflection error:', error);
          
          // Remove typing indicator and add error message
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== typingId);
            return [
              ...filtered,
              {
                id: Date.now().toString(),
                content: "I'm sorry, I couldn't process your reflection right now. Please try again.",
                isUser: false,
                timestamp: new Date()
              }
            ];
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Header 
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isProgressPage ? (
          <Progress />
        ) : (
          <div className="grid md:grid-cols-[1fr,400px] gap-6">
            <div className="flex flex-col h-[calc(100vh-12rem)]">
              <div className="flex-1 min-h-0">
                <ChatContainer 
                  messages={messages}
                />
              </div>
            </div>
            <div className="md:order-last">
              <div className="sticky top-24">
                <JournalInput 
                  onSubmit={handleSubmit}
                  isLoading={reflection.isPending}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
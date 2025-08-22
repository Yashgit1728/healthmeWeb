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
  chips?: string[];
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
          console.log('Reflection success:', responseData);
          console.log('AI response structure:', responseData.ai);
          
          // Handle both old and new response formats
          let aiContent: string;
          let aiChips: string[] = [];
          
          if ('response' in responseData.ai && responseData.ai.response) {
            // New format
            aiContent = responseData.ai.response;
            aiChips = responseData.ai.chips || [];
          } else if ('acknowledge' in responseData.ai) {
            // Old format - combine the parts
            const parts = [];
            if (responseData.ai.acknowledge) parts.push(responseData.ai.acknowledge);
            if (responseData.ai.reflect) parts.push(responseData.ai.reflect);
            if (responseData.ai.suggest) parts.push(responseData.ai.suggest);
            
            aiContent = parts.join(' ');
            aiChips = responseData.ai.chips || [];
          } else {
            // Fallback
            aiContent = "I hear you and appreciate you sharing your thoughts with me.";
            aiChips = ["Try breathing exercise", "Reframe thought", "Save as insight"];
          }
          
          console.log('Processed AI content:', aiContent);
          console.log('Processed AI chips:', aiChips);
          
          // Remove typing indicator and add AI response
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== typingId);
            return [
              ...filtered,
              {
                id: Date.now().toString(),
                content: aiContent,
                isUser: false,
                timestamp: new Date(),
                chips: aiChips
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

  const handleQuickAction = async (action: string) => {
    console.log('Quick action clicked:', action);
    
    // Add typing indicator
    const typingId = Date.now().toString();
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

    try {
      let response;
      switch (action) {
        case 'Try breathing exercise':
          response = "That sounds like a really good idea 😊 Want to try something gentle together? Just breathe in slowly for 4 counts, hold for 4, then exhale for 4. How does that feel for you?";
          break;
        case 'Reframe thought':
          response = "I hear you 💙 Sometimes looking at things from a different angle can be really helpful. What do you think might be another way to see this situation?";
          break;
        case 'Save as insight':
          response = "That's such an important realization 🌟 I'm glad you shared that with me. How does it feel to put that into words?";
          break;
        case 'Talk to someone':
          response = "That could be really comforting 🤗 Is there someone in your life who you feel safe opening up to about this?";
          break;
        case 'Take a walk':
          response = "Fresh air can be so grounding 🌸 Even just stepping outside for a few minutes can shift how we feel. What kind of places do you like to walk?";
          break;
        default:
          response = "I'm here with you 💙 What feels most important to talk about right now?";
      }

      // Remove typing indicator and add response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            content: response,
            isUser: false,
            timestamp: new Date()
          }
        ];
      });
    } catch {
      // Remove typing indicator and add error message
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            content: "I'm sorry, I couldn't process that action right now. Please try again.",
            isUser: false,
            timestamp: new Date()
          }
        ];
      });
    }
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
              <ChatContainer 
                messages={messages}
                onQuickActionClick={handleQuickAction}
              />
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
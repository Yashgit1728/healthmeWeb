import React, { useState, useRef, useCallback } from 'react';
import { ChatContainer } from './ChatContainer';
import { JournalInput } from './JournalInput';
import { useCreateReflection } from '../api/hooks';

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

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
}

export function ChatManager() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    // Load chat sessions from localStorage on component mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatSessions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Convert string dates back to Date objects
          return parsed.map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
        } catch (e) {
          console.error('Failed to parse saved chat sessions:', e);
        }
      }
    }
    return [];
  });
  
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    // Load active chat ID from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeChatId');
    }
    return null;
  });
  
  const createReflection = useCreateReflection();

  // Save chat sessions to localStorage whenever they change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (chatSessions.length > 0) {
        localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
      } else {
        localStorage.removeItem('chatSessions');
      }
    }
  }, [chatSessions]);

  // Save active chat ID to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeChatId) {
        localStorage.setItem('activeChatId', activeChatId);
      } else {
        localStorage.removeItem('activeChatId');
      }
    }
  }, [activeChatId]);

  // Create initial chat session if none exists
  React.useEffect(() => {
    if (chatSessions.length === 0) {
      const initialChat: ChatSession = {
        id: generateChatId(),
        name: 'Journal Chat',
        messages: [],
        createdAt: new Date()
      };
      setChatSessions([initialChat]);
      setActiveChatId(initialChat.id);
    }
  }, [chatSessions.length]);

  // Get active chat
  const activeChat = chatSessions.find(chat => chat.id === activeChatId);
  const activeMessages = activeChat?.messages || [];

  // Generate unique chat ID
  function generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create new chat session
  const createNewChat = useCallback(() => {
    const newChat: ChatSession = {
      id: generateChatId(),
      name: `Chat ${chatSessions.length + 1}`,
      messages: [],
      createdAt: new Date()
    };
    
    setChatSessions(prev => [...prev, newChat]);
    setActiveChatId(newChat.id);
  }, [chatSessions.length]);

  // Switch to different chat
  const switchChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
  }, []);

  // Delete chat session
  const deleteChat = useCallback((chatId: string) => {
    setChatSessions(prev => {
      const filtered = prev.filter(chat => chat.id !== chatId);
      // If we deleted the active chat, switch to the first available one
      if (activeChatId === chatId && filtered.length > 0) {
        setActiveChatId(filtered[0].id);
      } else if (filtered.length === 0) {
        // If no chats left, create a new one
        const newChat: ChatSession = {
          id: generateChatId(),
          name: 'Journal Chat',
          messages: [],
          createdAt: new Date()
        };
        setActiveChatId(newChat.id);
        return [newChat];
      }
      return filtered;
    });
  }, [activeChatId]);

  // Add message to active chat
  const addMessage = useCallback((message: Message) => {
    if (!activeChatId) return;
    
    setChatSessions(prev => prev.map(chat => 
      chat.id === activeChatId 
        ? { ...chat, messages: [...chat.messages, message] }
        : chat
    ));
  }, [activeChatId]);

  // Note: handleGetTips function removed for now - can be added back when suggestions are implemented

  // Handle reflection submission
  const handleSubmitReflection = async (data: { text: string; mood: number; tags: string[]; chatSessionId?: string }) => {
    if (!activeChatId) return;

    try {
      // Add user message immediately
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        content: data.text,
        isUser: true,
        timestamp: new Date()
      };
      addMessage(userMessage);

      // Add typing indicator
      const typingMessage: Message = {
        id: `typing_${Date.now()}`,
        content: 'AI is thinking...',
        isUser: false,
        timestamp: new Date(),
        isTyping: true
      };
      addMessage(typingMessage);

      // Submit reflection and get AI response
      const result = await createReflection.mutateAsync({
        ...data,
        chatSessionId: data.chatSessionId || activeChatId
      });
      
      // Remove typing indicator
      setChatSessions(prev => prev.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: chat.messages.filter(msg => !msg.isTyping) }
          : chat
      ));

      // Add AI response
      if (result && result.aiResponse) {
        // Combine message and follow-up question into one response
        let fullContent = result.aiResponse.message;
        if (result.aiResponse.followUpQuestion) {
          fullContent += '\n\n' + result.aiResponse.followUpQuestion;
        }
        
        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          content: fullContent,
          isUser: false,
          timestamp: new Date()
        };
        addMessage(aiMessage);
      }
    } catch (error) {
      console.error('Failed to submit reflection:', error);
      
      // Remove typing indicator on error
      setChatSessions(prev => prev.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: chat.messages.filter(msg => !msg.isTyping) }
          : chat
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Sessions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chat Sessions
                </h3>
                <button
                  onClick={createNewChat}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  title="Start New Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-2">
                {chatSessions.map(chat => (
                  <div
                    key={chat.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      activeChatId === chat.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => switchChat(chat.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {chat.messages.length} messages
                      </p>
                    </div>
                    {chatSessions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Delete Chat"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Chat Container */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activeChat?.name || 'Journal Chat'} 💬
                </h3>
              </div>
              <div className="h-[600px] overflow-hidden">
                <ChatContainer 
                  messages={activeMessages}
                  containerRef={containerRef}
                />
              </div>
            </div>
            
            {/* Journal Input */}
            <JournalInput 
              onSubmit={handleSubmitReflection}
              isLoading={createReflection.isPending}
              chatSessionId={activeChatId || undefined}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

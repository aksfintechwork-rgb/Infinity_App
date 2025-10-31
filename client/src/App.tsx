import { useState, useEffect, useCallback } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import LoginPage from './components/LoginPage';
import ChatLayout from './components/ChatLayout';
import * as api from './lib/api';
import { useWebSocket } from './lib/websocket';
import { requestNotificationPermission, notifyNewMessage, initializeAudio } from './lib/notifications';

interface User {
  id: number;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
}

interface Conversation {
  id: number;
  title?: string;
  members: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatarUrl?: string;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  body?: string;
  attachmentUrl?: string;
  createdAt: string;
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const ws = useWebSocket(token);

  useEffect(() => {
    if (token) {
      loadUserData();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  // Initialize audio on first user interaction (for token-restored sessions)
  useEffect(() => {
    if (!currentUser) return;

    const handleFirstClick = () => {
      initializeAudio();
      // Remove listener after first click
      document.removeEventListener('click', handleFirstClick);
    };

    document.addEventListener('click', handleFirstClick);

    return () => {
      document.removeEventListener('click', handleFirstClick);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!ws.isConnected || !currentUser) return;

    const unsubscribeMessage = ws.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessage: message.body || 'Sent an attachment',
                lastMessageTime: message.createdAt,
              }
            : conv
        )
      );

      // Show notification if message is not from current user
      // and either user is on different conversation or window is not focused
      if (message.senderId !== currentUser.id) {
        const shouldNotify = 
          message.conversationId !== activeConversationId || 
          !document.hasFocus();

        if (shouldNotify) {
          const conversation = conversations.find(c => c.id === message.conversationId);
          notifyNewMessage(
            message.senderName,
            message.body || 'Sent an attachment',
            conversation?.title,
            conversation?.isGroup || false
          );
        }
      }
    });

    // Listen for user creation events
    const unsubscribeUserCreated = ws.on('user_created', (user: User) => {
      setAllUsers((prev) => {
        // Deduplication: only add if user doesn't already exist
        if (prev.some((u) => u.id === user.id)) {
          return prev;
        }
        return [...prev, user];
      });
      console.log('New user created:', user.name);
    });

    // Listen for user deletion events
    const unsubscribeUserDeleted = ws.on('user_deleted', (data: { id: number }) => {
      setAllUsers((prev) => prev.filter((u) => u.id !== data.id));
      console.log('User deleted:', data.id);
    });

    // Listen for initial online users list
    const unsubscribeOnlineUsers = ws.on('online_users', (data: { userIds: number[] }) => {
      setOnlineUserIds(data.userIds);
      console.log('Online users:', data.userIds);
    });

    // Listen for user online events
    const unsubscribeUserOnline = ws.on('user_online', (data: { userId: number }) => {
      setOnlineUserIds((prev) => {
        if (prev.includes(data.userId)) {
          return prev;
        }
        return [...prev, data.userId];
      });
      console.log('User online:', data.userId);
    });

    // Listen for user offline events
    const unsubscribeUserOffline = ws.on('user_offline', (data: { userId: number }) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== data.userId));
      console.log('User offline:', data.userId);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeUserCreated();
      unsubscribeUserDeleted();
      unsubscribeOnlineUsers();
      unsubscribeUserOnline();
      unsubscribeUserOffline();
    };
  }, [ws.isConnected, ws.on, currentUser, activeConversationId, conversations]);

  const loadUserData = async () => {
    try {
      const [user, users, convs] = await Promise.all([
        api.getCurrentUser(token!),
        api.getAllUsers(token!),
        api.getConversations(token!),
      ]);

      setCurrentUser(user);
      setAllUsers(users);
      setConversations(convs);

      // Request notification permission after successful login
      requestNotificationPermission();
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Toast removed to fix React hook error
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: number) => {
    try {
      setActiveConversationId(conversationId);
      const msgs = await api.getMessages(token!, conversationId);
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.conversationId !== conversationId);
        return [...filtered, ...msgs];
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Toast removed to fix React hook error
    }
  };

  const handleLogin = async (loginId: string, password: string) => {
    try {
      // Initialize audio from this user gesture
      initializeAudio();
      
      // CRITICAL: Clear old token FIRST to prevent race conditions
      localStorage.removeItem('auth_token');
      setToken(null);
      
      // Small delay to ensure WebSocket closes with old token
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await api.login(loginId, password);
      localStorage.setItem('auth_token', response.token);
      setToken(response.token);
      setCurrentUser(response.user);
    } catch (error: any) {
      console.error('Login failed:', error);
      // Toast removed to fix React hook error
    }
  };

  const handleSendMessage = useCallback(
    (conversationId: number, body: string, attachmentUrl?: string) => {
      if (!body && !attachmentUrl) return;

      ws.send({
        type: 'new_message',
        data: {
          conversationId,
          body,
          attachmentUrl,
        },
      });
    },
    [ws]
  );

  const handleCreateConversation = async (title: string, memberIds: number[]) => {
    try {
      const newConv = await api.createConversation(token!, title, memberIds);
      setConversations((prev) => [newConv, ...prev]);
      
      // Toast removed to fix React hook error
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      // Toast removed to fix React hook error
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      const response = await api.uploadFile(token!, file);
      return response.url;
    } catch (error: any) {
      console.error('File upload failed:', error);
      // Toast removed to fix React hook error
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setCurrentUser(null);
    setAllUsers([]);
    setConversations([]);
    setMessages([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!currentUser ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <ChatLayout
            currentUser={currentUser}
            conversations={conversations}
            allUsers={allUsers}
            onlineUserIds={onlineUserIds}
            messages={messages}
            onSendMessage={handleSendMessage}
            onCreateConversation={handleCreateConversation}
            onFileUpload={handleFileUpload}
            onLogout={handleLogout}
            onConversationSelect={loadConversationMessages}
            ws={ws}
          />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

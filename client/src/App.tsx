import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import LoginPage from './components/LoginPage';
import ChatLayout from './components/ChatLayout';
import avatar1 from '@assets/stock_images/professional_busines_5a9f5906.jpg';
import avatar2 from '@assets/stock_images/professional_busines_347976e4.jpg';
import avatar3 from '@assets/stock_images/professional_busines_0c71d855.jpg';
import avatar4 from '@assets/stock_images/professional_busines_a59ed5b3.jpg';

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: 'Sales Team',
      members: 'Sarah, Michael, Emily',
      isGroup: true,
      lastMessage: 'Great work on the quarterly report!',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 2,
    },
    {
      id: 2,
      members: 'Michael Chen',
      isGroup: false,
      lastMessage: 'Thanks for the update',
      lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
      avatarUrl: avatar2,
    },
    {
      id: 3,
      members: 'Emily Rodriguez',
      isGroup: false,
      lastMessage: 'See you at the meeting',
      lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
      avatarUrl: avatar3,
    },
  ]);

  const [messages, setMessages] = useState([
    {
      id: 1,
      conversationId: 1,
      senderId: 2,
      senderName: 'Michael Chen',
      senderAvatar: avatar2,
      body: 'Hey team, I wanted to share the latest market analysis for this quarter.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 2,
      conversationId: 1,
      senderId: 1,
      senderName: 'Sarah Johnson',
      senderAvatar: avatar1,
      body: 'Thanks Michael! This looks comprehensive. I especially like the regional breakdown.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      conversationId: 1,
      senderId: 3,
      senderName: 'Emily Rodriguez',
      senderAvatar: avatar3,
      body: 'Great work on the quarterly report!',
      createdAt: new Date().toISOString(),
    },
  ]);

  const allUsers = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah.j@supremotraders.com', avatar: avatar1 },
    { id: 2, name: 'Michael Chen', email: 'michael.c@supremotraders.com', avatar: avatar2 },
    { id: 3, name: 'Emily Rodriguez', email: 'emily.r@supremotraders.com', avatar: avatar3 },
    { id: 4, name: 'David Kim', email: 'david.k@supremotraders.com', avatar: avatar4 },
  ];

  const handleLogin = (email: string, password: string) => {
    console.log('Login attempt:', { email, password });
    const user = allUsers.find((u) => u.email === email);
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser(allUsers[0]);
    }
  };

  const handleRegister = (name: string, email: string, password: string) => {
    console.log('Register attempt:', { name, email, password });
    const newUser = {
      id: allUsers.length + 1,
      name,
      email,
      avatar: undefined,
    };
    setCurrentUser(newUser);
  };

  const handleSendMessage = (conversationId: number, body: string, attachmentUrl?: string) => {
    console.log('Send message:', { conversationId, body, attachmentUrl });
    const newMessage = {
      id: messages.length + 1,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      body,
      attachmentUrl,
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, newMessage]);

    setConversations(
      conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: body || 'Sent an attachment',
              lastMessageTime: newMessage.createdAt,
            }
          : conv
      )
    );
  };

  const handleCreateConversation = (title: string, memberIds: number[]) => {
    console.log('Create conversation:', { title, memberIds });
    const members = allUsers
      .filter((u) => memberIds.includes(u.id))
      .map((u) => u.name.split(' ')[0])
      .join(', ');

    const newConversation: any = {
      id: conversations.length + 1,
      title: title || undefined,
      members,
      isGroup: memberIds.length > 1,
      unreadCount: 0,
    };
    setConversations([newConversation, ...conversations]);
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    console.log('Uploading file:', file.name);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`/uploads/${file.name}`);
      }, 1000);
    });
  };

  const handleLogout = () => {
    console.log('Logout');
    setCurrentUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!currentUser ? (
          <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
        ) : (
          <ChatLayout
            currentUser={currentUser}
            conversations={conversations}
            allUsers={allUsers}
            messages={messages}
            onSendMessage={handleSendMessage}
            onCreateConversation={handleCreateConversation}
            onFileUpload={handleFileUpload}
            onLogout={handleLogout}
          />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

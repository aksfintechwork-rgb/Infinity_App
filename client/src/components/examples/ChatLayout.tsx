import ChatLayout from '../ChatLayout';
import avatar1 from '@assets/stock_images/professional_busines_5a9f5906.jpg';
import avatar2 from '@assets/stock_images/professional_busines_347976e4.jpg';
import avatar3 from '@assets/stock_images/professional_busines_0c71d855.jpg';
import avatar4 from '@assets/stock_images/professional_busines_a59ed5b3.jpg';

const mockCurrentUser = {
  id: 1,
  name: 'Sarah Johnson',
  email: 'sarah.j@supremotraders.com',
  avatar: avatar1,
};

const mockUsers = [
  mockCurrentUser,
  { id: 2, name: 'Michael Chen', email: 'michael.c@supremotraders.com', avatar: avatar2 },
  { id: 3, name: 'Emily Rodriguez', email: 'emily.r@supremotraders.com', avatar: avatar3 },
  { id: 4, name: 'David Kim', email: 'david.k@supremotraders.com', avatar: avatar4 },
];

const mockConversations = [
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
];

const mockMessages = [
  {
    id: 1,
    conversationId: 1,
    senderId: 2,
    senderName: 'Michael Chen',
    senderAvatar: avatar2,
    body: 'Hey team, I wanted to share the latest market analysis.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 2,
    conversationId: 1,
    senderId: 1,
    senderName: 'Sarah Johnson',
    senderAvatar: avatar1,
    body: 'Thanks Michael! This looks comprehensive.',
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
];

export default function ChatLayoutExample() {
  return (
    <ChatLayout
      currentUser={mockCurrentUser}
      conversations={mockConversations}
      allUsers={mockUsers}
      messages={mockMessages}
      onSendMessage={(conversationId, body, attachmentUrl) =>
        console.log('Send:', { conversationId, body, attachmentUrl })
      }
      onCreateConversation={(title, memberIds) =>
        console.log('Create:', { title, memberIds })
      }
      onFileUpload={async (file) => {
        console.log('Upload:', file.name);
        return '/uploads/example.pdf';
      }}
      onLogout={() => console.log('Logout')}
    />
  );
}

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Hash, Moon, Sun } from 'lucide-react';
import ConversationItem from './ConversationItem';
import Message from './Message';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import NewConversationModal from './NewConversationModal';
import UserMenu from './UserMenu';
import logoImage from '@assets/generated_images/SUPREMO_TRADERS_LLP_logo_12753d7f.png';

interface User {
  id: number;
  name: string;
  email: string;
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

interface MessageType {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  body?: string;
  attachmentUrl?: string;
  createdAt: string;
}

interface ChatLayoutProps {
  currentUser: User;
  conversations: Conversation[];
  allUsers: User[];
  messages: MessageType[];
  onSendMessage: (conversationId: number, body: string, attachmentUrl?: string) => void;
  onCreateConversation: (title: string, memberIds: number[]) => void;
  onFileUpload: (file: File) => Promise<string>;
  onLogout: () => void;
  onConversationSelect?: (conversationId: number) => void;
}

export default function ChatLayout({
  currentUser,
  conversations,
  allUsers,
  messages,
  onSendMessage,
  onCreateConversation,
  onFileUpload,
  onLogout,
  onConversationSelect,
}: ChatLayoutProps) {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(
    conversations[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = messages.filter((m) => m.conversationId === activeConversationId);

  useEffect(() => {
    if (activeConversationId && onConversationSelect) {
      onConversationSelect(activeConversationId);
    }
  }, [activeConversationId, onConversationSelect]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.members.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="h-16 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Logo" className="w-8 h-8" />
            <div>
              <h1 className="text-sm font-bold text-foreground">SUPREMO TRADERS</h1>
              <p className="text-xs text-muted-foreground">Team Chat</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-conversations"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => setIsNewConversationOpen(true)}
            data-testid="button-new-conversation"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                {...conv}
                isActive={conv.id === activeConversationId}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  onConversationSelect?.(conv.id);
                }}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="h-16 border-t border-border flex items-center justify-between px-4 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsDark(!isDark)}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <UserMenu user={currentUser} onLogout={onLogout} />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            <div className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                {activeConversation.isGroup ? (
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Hash className="w-5 h-5 text-primary-foreground" />
                  </div>
                ) : null}
                <div>
                  <h2 className="font-semibold text-foreground" data-testid="text-conversation-title">
                    {activeConversation.title || activeConversation.members}
                  </h2>
                  {activeConversation.isGroup && (
                    <p className="text-sm text-muted-foreground">
                      {activeConversation.members}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 px-6 py-4">
              <div className="max-w-4xl mx-auto">
                {activeMessages.map((msg) => (
                  <Message
                    key={msg.id}
                    {...msg}
                    isCurrentUser={msg.senderId === currentUser.id}
                  />
                ))}
                {isTyping && <TypingIndicator userName="Someone" />}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="flex-shrink-0">
              <MessageInput
                onSendMessage={(body, attachmentUrl) =>
                  activeConversationId &&
                  onSendMessage(activeConversationId, body, attachmentUrl)
                }
                onTyping={setIsTyping}
                onFileUpload={onFileUpload}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
              <p className="text-sm">Choose a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>

      <NewConversationModal
        open={isNewConversationOpen}
        onClose={() => setIsNewConversationOpen(false)}
        users={allUsers.filter((u) => u.id !== currentUser.id)}
        onCreateConversation={onCreateConversation}
      />
    </div>
  );
}

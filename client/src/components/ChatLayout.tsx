import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Search, Hash, Moon, Sun, MessageSquare, Shield, Calendar as CalendarIcon, UserPlus, Menu, CheckCircle2 } from 'lucide-react';
import ConversationItem from './ConversationItem';
import Message from './Message';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import NewConversationModal from './NewConversationModal';
import AddMembersModal from './AddMembersModal';
import UserMenu from './UserMenu';
import AdminPanel from './AdminPanel';
import Calendar from './Calendar';
import Tasks from './Tasks';
import logoImage from '@assets/image_1761659890673.png';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
  ws?: {
    isConnected: boolean;
    send: (message: any) => void;
    on: (type: string, callback: (data: any) => void) => () => void;
  };
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
  ws,
}: ChatLayoutProps) {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(
    conversations[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'admin' | 'calendar' | 'tasks'>('chat');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.role === 'admin';
  const token = localStorage.getItem('auth_token') || '';

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

  const getAvailableUsersForGroup = () => {
    if (!activeConversation?.isGroup) return [];
    
    const conv = activeConversation as any;
    const currentMemberIds: number[] = conv.memberIds || [];
    
    return allUsers.filter(user => !currentMemberIds.includes(user.id));
  };

  const handleAddMembers = async (memberIds: number[], canViewHistory: boolean) => {
    if (!activeConversationId) return;
    
    try {
      await apiRequest('POST', `/api/conversations/${activeConversationId}/members`, {
        memberIds,
        canViewHistory,
      });
      
      window.location.reload();
    } catch (error) {
      console.error('Failed to add members:', error);
    }
  };

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
      <div className="hidden md:flex w-80 border-r border-border flex-col bg-gradient-to-b from-background via-background to-purple-50/30 dark:to-purple-950/10">
        <div className="h-18 border-b border-border/50 flex items-center justify-between px-4 flex-shrink-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={logoImage} alt="SUPREMO TRADERS Logo" className="w-11 h-11 object-contain rounded-xl shadow-md ring-2 ring-purple-200/50 dark:ring-purple-800/50" data-testid="img-brand-logo" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">SUPREMO TRADERS</h1>
              <p className="text-xs text-muted-foreground font-medium">Team Chat</p>
            </div>
          </div>
        </div>

        <div className="p-2 border-b border-border/50 flex-shrink-0">
          <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-1 p-1 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-lg shadow-inner`}>
            <Button
              size="sm"
              variant={currentView === 'chat' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('chat')}
              className={`transition-all ${currentView === 'chat' ? 'shadow-md' : ''}`}
              data-testid="button-view-chat"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button
              size="sm"
              variant={currentView === 'tasks' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('tasks')}
              className={`transition-all ${currentView === 'tasks' ? 'shadow-md' : ''}`}
              data-testid="button-view-tasks"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Tasks</span>
            </Button>
            <Button
              size="sm"
              variant={currentView === 'calendar' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('calendar')}
              className={`transition-all ${currentView === 'calendar' ? 'shadow-md' : ''}`}
              data-testid="button-view-calendar"
            >
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant={currentView === 'admin' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('admin')}
                className={`transition-all ${currentView === 'admin' ? 'shadow-md' : ''}`}
                data-testid="button-view-admin"
              >
                <Shield className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
          </div>
        </div>

        {currentView === 'chat' ? (
          <>
            <div className="p-4 border-b border-border/50 flex-shrink-0 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-800/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  data-testid="input-search-conversations"
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-md"
                onClick={() => setIsNewConversationOpen(true)}
                data-testid="button-new-conversation"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">No conversations found</h3>
                    <p className="text-xs text-muted-foreground">Start a new conversation to begin chatting</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      {...conv}
                      isActive={conv.id === activeConversationId}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        onConversationSelect?.(conv.id);
                      }}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        ) : currentView === 'calendar' ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground text-center">
              Switch to Calendar view to manage meetings
            </p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground text-center">
              Switch to Admin view to manage team members
            </p>
          </div>
        )}

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
        {currentView === 'admin' ? (
          <AdminPanel token={token} currentUserId={currentUser.id} />
        ) : currentView === 'calendar' ? (
          <Calendar currentUser={currentUser} />
        ) : currentView === 'tasks' ? (
          <Tasks currentUser={currentUser} allUsers={allUsers} ws={ws} />
        ) : activeConversation ? (
          <>
            <div className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(true)}
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
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
                    <p className="text-sm text-muted-foreground hidden md:block">
                      {activeConversation.members}
                    </p>
                  )}
                </div>
              </div>
              {activeConversation.isGroup && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddMembersOpen(true)}
                  className="hidden md:flex"
                  data-testid="button-add-members-to-group"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Members
                </Button>
              )}
              {activeConversation.isGroup && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddMembersOpen(true)}
                  className="md:hidden"
                  data-testid="button-add-members-mobile"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 px-3 md:px-6 py-4">
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

      <AddMembersModal
        isOpen={isAddMembersOpen}
        onClose={() => setIsAddMembersOpen(false)}
        onAddMembers={handleAddMembers}
        availableUsers={getAvailableUsersForGroup()}
        conversationTitle={activeConversation?.title || activeConversation?.members || 'Group'}
      />

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0 bg-gradient-to-b from-background via-background to-purple-50/30 dark:to-purple-950/10">
          <div className="flex flex-col h-full">
            <div className="h-18 border-b border-border/50 flex items-center justify-between px-4 bg-gradient-to-r from-purple-600/5 to-blue-600/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={logoImage} alt="SUPREMO TRADERS Logo" className="w-11 h-11 object-contain rounded-xl shadow-md ring-2 ring-purple-200/50 dark:ring-purple-800/50" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div>
                  <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">SUPREMO TRADERS</h1>
                  <p className="text-xs text-muted-foreground font-medium">Team Chat</p>
                </div>
              </div>
            </div>

            <div className="p-2 border-b border-border">
              <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-1 p-1 bg-muted rounded-md`}>
                <Button
                  size="sm"
                  variant={currentView === 'chat' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('chat'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-chat-mobile"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Chat
                </Button>
                <Button
                  size="sm"
                  variant={currentView === 'tasks' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('tasks'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-tasks-mobile"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Tasks
                </Button>
                <Button
                  size="sm"
                  variant={currentView === 'calendar' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('calendar'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-calendar-mobile"
                >
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Calendar
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    onClick={() => { setCurrentView('admin'); setIsMobileMenuOpen(false); }}
                    data-testid="button-view-admin-mobile"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Admin
                  </Button>
                )}
              </div>
            </div>

            {currentView === 'chat' && (
              <>
                <div className="p-4 border-b border-border">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-conversations-mobile"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setIsNewConversationOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    data-testid="button-new-conversation-mobile"
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
                          setIsMobileMenuOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}

            <div className="h-16 border-t border-border flex items-center justify-between px-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsDark(!isDark)}
                data-testid="button-theme-toggle-mobile"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <UserMenu user={currentUser} onLogout={onLogout} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

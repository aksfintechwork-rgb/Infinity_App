import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Search, Hash, Moon, Sun, MessageSquare, Shield, Calendar as CalendarIcon, UserPlus, Menu, CheckCircle2, Video } from 'lucide-react';
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
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
  memberIds?: number[];
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
  onlineUserIds: number[];
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
  onlineUserIds,
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
  const [activeVideoCall, setActiveVideoCall] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.role === 'admin';
  const token = localStorage.getItem('auth_token') || '';
  const { toast } = useToast();

  const { data: pinnedConversationIds = [] } = useQuery<number[]>({
    queryKey: ['/api/pinned-conversations'],
  });

  const pinMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return await apiRequest('POST', `/api/conversations/${conversationId}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pinned-conversations'] });
      toast({
        title: 'Conversation pinned',
        description: 'This conversation has been pinned to the top',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to pin conversation',
        description: error.message || 'You can only pin up to 3 conversations',
        variant: 'destructive',
      });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return await apiRequest('DELETE', `/api/conversations/${conversationId}/unpin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pinned-conversations'] });
      toast({
        title: 'Conversation unpinned',
        description: 'This conversation has been unpinned',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to unpin conversation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handlePinToggle = (conversationId: number) => {
    if (pinnedConversationIds.includes(conversationId)) {
      unpinMutation.mutate(conversationId);
    } else {
      pinMutation.mutate(conversationId);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = messages.filter((m) => m.conversationId === activeConversationId);

  useEffect(() => {
    if (activeConversationId && onConversationSelect) {
      onConversationSelect(activeConversationId);
    }
  }, [activeConversationId, onConversationSelect]);

  const filteredConversations = conversations
    .filter(
      (conv) =>
        conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.members.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aIsPinned = pinnedConversationIds.includes(a.id);
      const bIsPinned = pinnedConversationIds.includes(b.id);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0;
    });

  // Helper function to check if a conversation's other user is online
  const isConversationOnline = (conv: Conversation): boolean => {
    if (conv.isGroup || !conv.memberIds) return false;
    const otherUserId = conv.memberIds.find(id => id !== currentUser.id);
    return otherUserId ? onlineUserIds.includes(otherUserId) : false;
  };

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

  const handleStartCall = () => {
    if (!activeConversation) return;
    
    // Generate a deterministic Jitsi room name so all participants join the same room
    // Using conversation ID ensures everyone in the same conversation joins the same call
    const roomName = `supremo-chat-conv-${activeConversation.id}`;
    
    // Configure Jitsi to hide branding and customize interface
    const config = [
      'config.prejoinPageEnabled=false',
      'config.startWithAudioMuted=false',
      'config.startWithVideoMuted=false',
      'interfaceConfig.SHOW_JITSI_WATERMARK=false',
      'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
      'interfaceConfig.SHOW_BRAND_WATERMARK=false',
      'interfaceConfig.BRAND_WATERMARK_LINK=""',
      'interfaceConfig.JITSI_WATERMARK_LINK=""',
      'interfaceConfig.SHOW_POWERED_BY=false',
      'interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT=false',
      'interfaceConfig.DISPLAY_WELCOME_FOOTER=false',
      'interfaceConfig.APP_NAME="SUPREMO TRADERS"',
      'interfaceConfig.NATIVE_APP_NAME="SUPREMO TRADERS"'
    ].join('&');
    
    const jitsiLink = `https://meet.jit.si/${roomName}#${config}`;
    setActiveVideoCall(jitsiLink);
  };

  const handleLeaveCall = () => {
    setActiveVideoCall(null);
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:flex w-80 border-r border-border flex-col bg-background">
        <div className="h-16 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={logoImage} alt="SUPREMO TRADERS Logo" className="w-10 h-10 object-contain rounded-lg" data-testid="img-brand-logo" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">SUPREMO TRADERS</h1>
              <p className="text-xs text-muted-foreground">Team Chat</p>
            </div>
          </div>
        </div>

        <div className="p-3 border-b border-border flex-shrink-0">
          <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 p-0.5 bg-muted/50 rounded-lg`}>
            <Button
              size="sm"
              variant={currentView === 'chat' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('chat')}
              data-testid="button-view-chat"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              <span className="text-xs">Chat</span>
            </Button>
            <Button
              size="sm"
              variant={currentView === 'tasks' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('tasks')}
              data-testid="button-view-tasks"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span className="text-xs">Tasks</span>
            </Button>
            <Button
              size="sm"
              variant={currentView === 'calendar' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('calendar')}
              data-testid="button-view-calendar"
            >
              <CalendarIcon className="w-4 h-4 mr-1.5" />
              <span className="text-xs">Calendar</span>
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant={currentView === 'admin' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('admin')}
                data-testid="button-view-admin"
              >
                <Shield className="w-4 h-4 mr-1.5" />
                <span className="text-xs">Admin</span>
              </Button>
            )}
          </div>
        </div>

        {currentView === 'chat' ? (
          <>
            <div className="p-3 border-b border-border flex-shrink-0 space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-search-conversations"
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                size="sm"
                onClick={() => setIsNewConversationOpen(true)}
                data-testid="button-new-conversation"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <MessageSquare className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-sm mb-1">No conversations</h3>
                    <p className="text-xs text-muted-foreground">Start a new conversation</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      {...conv}
                      isActive={conv.id === activeConversationId}
                      isOnline={isConversationOnline(conv)}
                      isPinned={pinnedConversationIds.includes(conv.id)}
                      onPinToggle={handlePinToggle}
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

        <div className="h-14 border-t border-border flex items-center justify-between px-3 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsDark(!isDark)}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
        ) : activeVideoCall ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                <h2 className="font-semibold">
                  {activeConversation?.isGroup ? 'Group Call' : 'Video Call'}
                </h2>
              </div>
              <Button
                variant="outline"
                onClick={handleLeaveCall}
                data-testid="button-leave-call"
              >
                Leave Call
              </Button>
            </div>
            <div className="flex-1">
              <iframe
                src={activeVideoCall}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
                title="Video Call"
              />
            </div>
          </div>
        ) : activeConversation ? (
          <>
            <div className="min-h-[64px] md:h-16 border-b border-border flex items-center justify-between px-3 md:px-6 flex-shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-11 w-11"
                  onClick={() => setIsMobileMenuOpen(true)}
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-6 h-6" />
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
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartCall}
                  className="hidden md:flex"
                  data-testid="button-start-call"
                >
                  <Video className="w-4 h-4 mr-2" />
                  {activeConversation.isGroup ? 'Start Group Call' : 'Start Call'}
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleStartCall}
                  className="md:hidden h-11 w-11"
                  data-testid="button-start-call-mobile"
                >
                  <Video className="w-5 h-5" />
                </Button>
                {activeConversation.isGroup && (
                  <>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAddMembersOpen(true)}
                      className="md:hidden h-11 w-11"
                      data-testid="button-add-members-mobile"
                    >
                      <UserPlus className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>
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
        <SheetContent side="left" className="w-[90vw] max-w-sm p-0 bg-gradient-to-b from-background via-background to-purple-50/30 dark:to-purple-950/10">
          <div className="flex flex-col h-full">
            <div className="min-h-[72px] border-b border-border/50 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600/5 to-blue-600/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={logoImage} alt="SUPREMO TRADERS Logo" className="w-12 h-12 object-contain rounded-xl shadow-md ring-2 ring-purple-200/50 dark:ring-purple-800/50" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div>
                  <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">SUPREMO TRADERS</h1>
                  <p className="text-xs text-muted-foreground font-medium">Team Chat</p>
                </div>
              </div>
            </div>

            <div className="p-3 border-b border-border">
              <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-3'} gap-2 p-1.5 bg-muted rounded-lg`}>
                <Button
                  variant={currentView === 'chat' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('chat'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-chat-mobile"
                  className="h-11 text-sm font-medium"
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Chat
                </Button>
                <Button
                  variant={currentView === 'tasks' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('tasks'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-tasks-mobile"
                  className="h-11 text-sm font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Tasks
                </Button>
                {!isAdmin && (
                  <Button
                    variant={currentView === 'calendar' ? 'default' : 'ghost'}
                    onClick={() => { setCurrentView('calendar'); setIsMobileMenuOpen(false); }}
                    data-testid="button-view-calendar-mobile"
                    className="h-11 text-sm font-medium"
                  >
                    <CalendarIcon className="w-4 h-4 mr-1.5" />
                    Calendar
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button
                      variant={currentView === 'calendar' ? 'default' : 'ghost'}
                      onClick={() => { setCurrentView('calendar'); setIsMobileMenuOpen(false); }}
                      data-testid="button-view-calendar-mobile"
                      className="h-11 text-sm font-medium"
                    >
                      <CalendarIcon className="w-4 h-4 mr-1.5" />
                      Calendar
                    </Button>
                    <Button
                      variant={currentView === 'admin' ? 'default' : 'ghost'}
                      onClick={() => { setCurrentView('admin'); setIsMobileMenuOpen(false); }}
                      data-testid="button-view-admin-mobile"
                      className="h-11 text-sm font-medium"
                    >
                      <Shield className="w-4 h-4 mr-1.5" />
                      Admin
                    </Button>
                  </>
                )}
              </div>
            </div>

            {currentView === 'chat' && (
              <>
                <div className="p-4 border-b border-border space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 text-base"
                      data-testid="input-search-conversations-mobile"
                    />
                  </div>
                  <Button
                    className="w-full h-11 text-base font-semibold"
                    onClick={() => {
                      setIsNewConversationOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    data-testid="button-new-conversation-mobile"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    New Conversation
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1.5">
                    {filteredConversations.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        {...conv}
                        isActive={conv.id === activeConversationId}
                        isOnline={isConversationOnline(conv)}
                        isPinned={pinnedConversationIds.includes(conv.id)}
                        onPinToggle={handlePinToggle}
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

            <div className="min-h-[68px] border-t border-border flex items-center justify-between px-4 py-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsDark(!isDark)}
                data-testid="button-theme-toggle-mobile"
                className="h-11 w-11"
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

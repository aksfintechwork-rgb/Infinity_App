import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Search, Hash, Moon, Sun, MessageSquare, Shield, Calendar as CalendarIcon, UserPlus, Menu, CheckCircle2, Video, ArrowLeft, Users, FileText, Phone, PhoneOff, Folder, HardDrive, ListChecks } from 'lucide-react';
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
import TodoList from './TodoList';
import DailyWorksheet from './DailyWorksheet';
import AdminWorksheets from './AdminWorksheets';
import Projects from './Projects';
import SupremoDrive from './SupremoDrive';
import { UpcomingMeetings } from './UpcomingMeetings';
import IncomingCallModal from './IncomingCallModal';
import EditMessageDialog from './EditMessageDialog';
import ForwardMessageDialog from './ForwardMessageDialog';
import InviteToCallDialog from './InviteToCallDialog';
import { useOutgoingRingtone } from '@/hooks/use-outgoing-ringtone';
import logoImage from '@assets/image_1761659890673.png';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatLastSeen } from '@/lib/utils';

interface User {
  id: number;
  name: string;
  loginId: string;
  email?: string;
  role: string;
  avatar?: string;
  lastSeenAt?: string;
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
  replyToId?: number;
  repliedToMessage?: {
    id: number;
    senderName: string;
    body?: string;
    attachmentUrl?: string;
  };
}

interface ChatLayoutProps {
  currentUser: User;
  conversations: Conversation[];
  allUsers: User[];
  onlineUserIds: number[];
  messages: MessageType[];
  onSendMessage: (conversationId: number, body: string, attachmentUrl?: string, replyToId?: number) => void;
  onCreateConversation: (title: string, memberIds: number[]) => void;
  onFileUpload: (file: File) => Promise<string>;
  onLogout: () => void;
  onConversationSelect?: (conversationId: number) => void;
  onMarkConversationAsRead?: (conversationId: number) => void;
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
  onMarkConversationAsRead,
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
  const [currentView, setCurrentView] = useState<'chat' | 'admin' | 'calendar' | 'tasks' | 'todo' | 'worksheet' | 'admin-worksheets' | 'projects' | 'drive'>('chat');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastConversationIdRef = useRef<number | null>(null);
  
  // Incoming call state
  const [incomingCall, setIncomingCall] = useState<{
    from: { id: number; name: string; avatar?: string };
    conversationId: number;
    callType: 'audio' | 'video';
    roomName: string;
  } | null>(null);

  // Outgoing call state
  const [outgoingCall, setOutgoingCall] = useState<{
    conversationId: number;
    callType: 'audio' | 'video';
    calledName: string;
  } | null>(null);

  // Active call state (persists after call is answered)
  const [activeCall, setActiveCall] = useState<{
    conversationId: number;
    callType: 'audio' | 'video';
    roomName: string;
  } | null>(null);

  // Edit and forward message state
  const [editingMessage, setEditingMessage] = useState<{ id: number; body: string } | null>(null);
  const [forwardingMessageId, setForwardingMessageId] = useState<number | null>(null);

  // Reply to message state
  const [replyingTo, setReplyingTo] = useState<{ id: number; senderName: string; body?: string } | null>(null);

  // Invite to call state
  const [isInviteToCallOpen, setIsInviteToCallOpen] = useState(false);

  // Track call window reference
  const callWindowRef = useRef<Window | null>(null);
  const windowCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play outgoing ringtone when calling someone
  useOutgoingRingtone(!!outgoingCall);

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

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      // Optimistic update: immediately clear unread badge in UI
      if (onMarkConversationAsRead) {
        onMarkConversationAsRead(conversationId);
      }
      return await apiRequest('POST', `/api/conversations/${conversationId}/mark-read`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      await queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
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

  // Mark conversation as read when opened
  useEffect(() => {
    if (activeConversationId) {
      markAsReadMutation.mutate(activeConversationId);
    }
  }, [activeConversationId]);

  const filteredConversations = conversations
    .filter(
      (conv) =>
        conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.members.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // First sort by pinned status
      const aIsPinned = pinnedConversationIds.includes(a.id);
      const bIsPinned = pinnedConversationIds.includes(b.id);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      // Then sort by most recent message (newest first)
      const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return bTime - aTime;
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

  // Auto-scroll to bottom: always on conversation switch, or when user is near bottom
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Check if we've switched to a different conversation
    const hasConversationChanged = lastConversationIdRef.current !== activeConversationId;
    if (hasConversationChanged) {
      lastConversationIdRef.current = activeConversationId;
      // Always scroll to bottom when switching conversations
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        });
      });
      return;
    }

    // Check if user is near the bottom (generous 300px threshold)
    // This ensures chat stays at latest by default, but respects user scrolling up
    const distanceFromBottom = 
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
    const isNearBottom = distanceFromBottom < 300;

    // Auto-scroll to bottom if user is near bottom (they want to see latest messages)
    if (isNearBottom) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        });
      });
    }
  }, [activeMessages, activeConversationId]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // WebSocket listener for incoming calls
  useEffect(() => {
    if (!ws?.on) return;

    const unsubscribe = ws.on('incoming_call', (data: any) => {
      // Don't show notification if the call is from me
      if (data.from.id === currentUser.id) return;

      // Check if this user is part of the conversation
      const conversation = conversations.find(c => c.id === data.conversationId);
      if (!conversation) return;

      // Show incoming call notification
      setIncomingCall({
        from: data.from,
        conversationId: data.conversationId,
        callType: data.callType,
        roomName: data.roomName,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [ws, currentUser.id, conversations]);

  // WebSocket listeners for call responses (to stop outgoing ringtone)
  useEffect(() => {
    if (!ws?.on) return;

    const unsubscribeAnswered = ws.on('call_answered', (data: any) => {
      // Stop outgoing ringtone if this is my call
      if (outgoingCall && data.conversationId === outgoingCall.conversationId) {
        // Set active call state to keep Invite button visible
        setActiveCall({
          conversationId: outgoingCall.conversationId,
          callType: outgoingCall.callType,
          roomName: outgoingCall.callType === 'video' 
            ? `supremo-video-${outgoingCall.conversationId}`
            : `supremo-audio-${outgoingCall.conversationId}`
        });
        setOutgoingCall(null);
      }
    });

    const unsubscribeRejected = ws.on('call_rejected', (data: any) => {
      // Stop outgoing ringtone if this is my call
      if (outgoingCall && data.conversationId === outgoingCall.conversationId) {
        setOutgoingCall(null);
        toast({
          title: 'Call declined',
          description: `${outgoingCall.calledName} declined the call`,
          variant: 'destructive',
        });
      }
    });

    const unsubscribeCancelled = ws.on('call_cancelled', (data: any) => {
      // Stop incoming ringtone if caller cancelled the call
      if (incomingCall && data.conversationId === incomingCall.conversationId) {
        setIncomingCall(null);
        toast({
          title: 'Missed call',
          description: `${data.callerName} cancelled the call`,
        });
      }
    });

    return () => {
      unsubscribeAnswered();
      unsubscribeRejected();
      unsubscribeCancelled();
    };
  }, [ws, outgoingCall, incomingCall, toast]);

  // Auto-timeout for outgoing call after 30 seconds
  useEffect(() => {
    if (!outgoingCall) return;

    const timeout = setTimeout(() => {
      setOutgoingCall(null);
      toast({
        title: 'Call timeout',
        description: 'No answer',
      });
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(timeout);
    };
  }, [outgoingCall, toast]);

  // Monitor call window - clear call state when window is closed
  useEffect(() => {
    if ((!outgoingCall && !activeCall) || !callWindowRef.current) return;

    // Check if window is closed every 500ms
    windowCheckIntervalRef.current = setInterval(() => {
      if (callWindowRef.current && callWindowRef.current.closed) {
        // Window was closed - clear all call states
        setOutgoingCall(null);
        setActiveCall(null);
        callWindowRef.current = null;
        
        if (windowCheckIntervalRef.current) {
          clearInterval(windowCheckIntervalRef.current);
          windowCheckIntervalRef.current = null;
        }
      }
    }, 500);

    return () => {
      if (windowCheckIntervalRef.current) {
        clearInterval(windowCheckIntervalRef.current);
        windowCheckIntervalRef.current = null;
      }
    };
  }, [outgoingCall, activeCall]);

  // Edit and forward message handlers
  const handleEditMessage = (messageId: number, currentBody: string) => {
    setEditingMessage({ id: messageId, body: currentBody });
  };

  const handleForwardMessage = (messageId: number) => {
    setForwardingMessageId(messageId);
  };

  const handleReply = (messageId: number, senderName: string) => {
    const message = messages.find(m => m.id === messageId);
    setReplyingTo({
      id: messageId,
      senderName,
      body: message?.body
    });
  };

  const handleMessageEdited = (messageId: number, newBody: string, editedAt: Date) => {
    // Close the edit dialog - App.tsx WebSocket listener will update message state
    setEditingMessage(null);
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await apiRequest('DELETE', `/api/messages/${messageId}`);

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // WebSocket listener in App.tsx will handle updating message state
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  // Handle inviting user to active call
  const handleSendCallInvite = (userId: number) => {
    // Use activeCall if available, otherwise use outgoingCall
    const callInfo = activeCall || outgoingCall;
    if (!callInfo || !ws?.isConnected) return;

    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    // Generate the room name based on conversation and call type
    const roomName = activeCall 
      ? activeCall.roomName 
      : (outgoingCall!.callType === 'video' 
          ? `supremo-video-${outgoingCall!.conversationId}`
          : `supremo-audio-${outgoingCall!.conversationId}`);

    // Send invitation via WebSocket
    ws.send({
      type: 'invite_to_call',
      data: {
        userId,
        conversationId: callInfo.conversationId,
        callType: callInfo.callType,
        roomName,
        from: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        }
      }
    });
  };

  // Handle accepting incoming call
  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    try {
      // Send call answered notification to caller via WebSocket (stops their outgoing ringtone)
      if (ws?.isConnected) {
        ws.send({
          type: 'call_answered',
          data: {
            conversationId: incomingCall.conversationId,
          }
        });
      }

      // Create room first via backend API
      const response = await apiRequest('POST', '/api/daily/create-room', { roomName: incomingCall.roomName });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create room');
      }
      
      // Open the room in new window and join immediately with user name, video off by default
      const callUrl = `${data.url}?userName=${encodeURIComponent(currentUser.name)}&video=false`;
      const callWindow = window.open(callUrl, '_blank', 'noopener,noreferrer');
      
      // Track window to detect when call ends
      callWindowRef.current = callWindow;
      
      // Set active call state to keep Invite button visible
      setActiveCall({
        conversationId: incomingCall.conversationId,
        callType: incomingCall.callType,
        roomName: incomingCall.roomName
      });

      toast({
        title: 'Joined call',
        description: `Connected to ${incomingCall.from.name}`,
      });
    } catch (error) {
      console.error('Error joining call:', error);
      toast({
        title: 'Error',
        description: 'Failed to join call. Please try again.',
        variant: 'destructive'
      });
    }

    // Close the incoming call modal
    setIncomingCall(null);
  };

  // Handle rejecting incoming call
  const handleRejectCall = () => {
    if (!incomingCall) return;

    // Send call rejected notification to caller via WebSocket (stops their outgoing ringtone)
    if (ws?.isConnected) {
      ws.send({
        type: 'call_rejected',
        data: {
          conversationId: incomingCall.conversationId,
        }
      });
    }

    toast({
      title: 'Call declined',
      description: `Declined call from ${incomingCall.from.name}`,
    });

    // Close the incoming call modal
    setIncomingCall(null);
  };

  const handleStartCall = async () => {
    if (!activeConversation) return;
    
    // Generate a deterministic room name for Daily.co
    const roomName = `supremo-video-${activeConversation.id}`;
    
    try {
      // Create room first via backend API
      const response = await apiRequest('POST', '/api/daily/create-room', { roomName });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create room');
      }
      
      // Register the call in the database
      try {
        await apiRequest('POST', '/api/calls', {
          roomName,
          roomUrl: data.url,
          conversationId: activeConversation.id,
          callType: 'video',
        });
      } catch (dbError) {
        console.error('Failed to register call in database:', dbError);
      }
      
      // Open the room in new window with user name and video off by default - instant join!
      const callUrl = `${data.url}?userName=${encodeURIComponent(currentUser.name)}&video=false`;
      const callWindow = window.open(callUrl, '_blank', 'noopener,noreferrer');
      
      // Store window reference to monitor when it's closed
      callWindowRef.current = callWindow;
      
      // Set active call state to keep Invite button visible
      setActiveCall({
        conversationId: activeConversation.id,
        callType: 'video',
        roomName
      });
      
      // Send incoming call notification to other members via WebSocket
      if (ws?.isConnected) {
        ws.send({
          type: 'incoming_call',
          data: {
            conversationId: activeConversation.id,
            roomName: roomName,
            callType: 'video',
            from: {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar
            }
          }
        });
      }

      // Start outgoing call ringtone
      setOutgoingCall({
        conversationId: activeConversation.id,
        callType: 'video',
        calledName: activeConversation.title || activeConversation.members,
      });
      
      toast({
        title: 'Video call started',
        description: 'Calling ' + (activeConversation.title || activeConversation.members) + '...',
      });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to start video call. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleQuickAudioCall = async (conversationId: number) => {
    // Find the conversation
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Generate a deterministic room name for Daily.co
    const roomName = `supremo-audio-${conversationId}`;
    
    try {
      // Create room first via backend API
      const response = await apiRequest('POST', '/api/daily/create-room', { roomName });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create room');
      }
      
      // Register the call in the database
      try {
        await apiRequest('POST', '/api/calls', {
          roomName,
          roomUrl: data.url,
          conversationId,
          callType: 'audio',
        });
      } catch (dbError) {
        console.error('Failed to register call in database:', dbError);
      }
      
      // Open the room in new window with video disabled and user name for audio calls
      const audioCallUrl = `${data.url}?userName=${encodeURIComponent(currentUser.name)}&video=false`;
      const callWindow = window.open(audioCallUrl, '_blank', 'noopener,noreferrer');
      
      // Store window reference to monitor when it's closed
      callWindowRef.current = callWindow;
      
      // Send incoming call notification to other members via WebSocket
      if (ws?.isConnected) {
        ws.send({
          type: 'incoming_call',
          data: {
            conversationId: conversationId,
            roomName: roomName,
            callType: 'audio',
            from: {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar
            }
          }
        });
      }

      // Start outgoing call ringtone
      const displayName = conversation.title || conversation.members;
      setOutgoingCall({
        conversationId: conversationId,
        callType: 'audio',
        calledName: displayName,
      });
      
      toast({
        title: 'Audio call started',
        description: `Calling ${displayName}...`,
      });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to start audio call. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleStartAudioCall = async () => {
    if (!activeConversation) return;
    
    // Generate a deterministic room name for Daily.co
    const roomName = `supremo-audio-${activeConversation.id}`;
    
    try {
      // Create room first via backend API
      const response = await apiRequest('POST', '/api/daily/create-room', { roomName });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create room');
      }
      
      // Register the call in the database
      try {
        await apiRequest('POST', '/api/calls', {
          roomName,
          roomUrl: data.url,
          conversationId: activeConversation.id,
          callType: 'audio',
        });
      } catch (dbError) {
        console.error('Failed to register call in database:', dbError);
      }
      
      // Open the room in new window with video disabled and user name for audio calls - instant join!
      const audioCallUrl = `${data.url}?userName=${encodeURIComponent(currentUser.name)}&video=false`;
      const callWindow = window.open(audioCallUrl, '_blank', 'noopener,noreferrer');
      
      // Store window reference to monitor when it's closed
      callWindowRef.current = callWindow;
      
      // Set active call state to keep Invite button visible
      setActiveCall({
        conversationId: activeConversation.id,
        callType: 'audio',
        roomName
      });
      
      // Send incoming call notification to other members via WebSocket
      if (ws?.isConnected) {
        ws.send({
          type: 'incoming_call',
          data: {
            conversationId: activeConversation.id,
            roomName: roomName,
            callType: 'audio',
            from: {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar
            }
          }
        });
      }

      // Start outgoing call ringtone
      setOutgoingCall({
        conversationId: activeConversation.id,
        callType: 'audio',
        calledName: activeConversation.title || activeConversation.members,
      });
      
      toast({
        title: 'Audio call started',
        description: 'Calling ' + (activeConversation.title || activeConversation.members) + '...',
      });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to start audio call. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:flex w-80 border-r border-border flex-col bg-background">
        <div className="h-[72px] border-b border-border flex items-center px-5 flex-shrink-0 bg-secondary/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <img src={logoImage} alt="SUPREMO TRADERS Logo" className="w-8 h-8 object-contain" data-testid="img-brand-logo" />
            </div>
            <div>
              <h1 className="text-base font-bold text-secondary-foreground tracking-tight">SUPREMO TRADERS</h1>
              <p className="text-xs text-muted-foreground font-medium">Team Chat</p>
            </div>
          </div>
        </div>

        <div className="px-3 py-3 border-b border-border flex-shrink-0 bg-background">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={currentView === 'chat' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('chat')}
              data-testid="button-view-chat"
              className="h-11 justify-start font-medium text-sm"
            >
              <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Chat</span>
            </Button>
            <Button
              variant={currentView === 'tasks' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('tasks')}
              data-testid="button-view-tasks"
              className="h-11 justify-start font-medium text-sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Tasks</span>
            </Button>
            <Button
              variant={currentView === 'todo' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('todo')}
              data-testid="button-view-todo"
              className="h-11 justify-start font-medium text-sm"
            >
              <ListChecks className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">To-Do</span>
            </Button>
            <Button
              variant={currentView === 'calendar' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('calendar')}
              data-testid="button-view-calendar"
              className="h-11 justify-start font-medium text-sm"
            >
              <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Calendar</span>
            </Button>
            <Button
              variant={currentView === 'worksheet' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('worksheet')}
              data-testid="button-view-worksheet"
              className="h-11 justify-start font-medium text-sm"
            >
              <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Work Log</span>
            </Button>
            <Button
              variant={currentView === 'projects' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('projects')}
              data-testid="button-view-projects"
              className="h-11 justify-start font-medium text-sm"
            >
              <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Projects</span>
            </Button>
            <Button
              variant={currentView === 'drive' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('drive')}
              data-testid="button-view-drive"
              className="h-11 justify-start font-medium text-sm"
            >
              <HardDrive className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Supremo Drive</span>
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant={currentView === 'admin' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('admin')}
                  data-testid="button-view-admin"
                  className="h-11 justify-start font-medium text-sm"
                >
                  <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Admin</span>
                </Button>
                <Button
                  variant={currentView === 'admin-worksheets' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('admin-worksheets')}
                  data-testid="button-view-admin-worksheets"
                  className="h-11 justify-start font-medium text-sm"
                >
                  <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Team Logs</span>
                </Button>
              </>
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
                className="w-full"
                size="sm"
                onClick={() => setIsNewConversationOpen(true)}
                data-testid="button-new-conversation"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            </div>

            <UpcomingMeetings currentUser={currentUser} />

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
                      onAudioCall={handleQuickAudioCall}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        onConversationSelect?.(conv.id);
                        onMarkConversationAsRead?.(conv.id);
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
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-2">Admin Panel</h3>
              <p className="text-sm text-muted-foreground">
                Switch to Admin view to manage team members and settings
              </p>
            </div>
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
          <Calendar currentUser={currentUser} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        ) : currentView === 'tasks' ? (
          <Tasks currentUser={currentUser} allUsers={allUsers} ws={ws} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        ) : currentView === 'todo' ? (
          <TodoList currentUser={currentUser} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        ) : currentView === 'worksheet' ? (
          <DailyWorksheet currentUser={currentUser} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        ) : currentView === 'admin-worksheets' ? (
          <AdminWorksheets allUsers={allUsers} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        ) : currentView === 'projects' ? (
          <Projects currentUser={currentUser} allUsers={allUsers} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        ) : currentView === 'drive' ? (
          <SupremoDrive currentUser={currentUser} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        ) : activeConversation ? (
          <>
            <div className="min-h-[64px] md:h-16 border-b border-border flex items-center justify-between px-3 md:px-6 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Mobile: Show both back button AND menu button */}
                <div className="flex items-center gap-2 md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveConversationId(null)}
                    data-testid="button-back-to-conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(true)}
                    data-testid="button-mobile-menu"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Desktop: Show menu button only */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex"
                  onClick={() => setIsMobileMenuOpen(true)}
                  data-testid="button-desktop-menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {activeConversation.isGroup ? (
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-primary-foreground" />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-foreground truncate" data-testid="text-conversation-title">
                    {activeConversation.title || activeConversation.members}
                  </h2>
                  {activeConversation.isGroup ? (
                    <p className="text-xs text-muted-foreground truncate md:block hidden">
                      {activeConversation.members}
                    </p>
                  ) : (
                    <>
                      {(() => {
                        const otherUserId = activeConversation.memberIds?.find(id => id !== currentUser.id);
                        const otherUser = allUsers.find(u => u.id === otherUserId);
                        const isOnline = otherUserId ? onlineUserIds.includes(otherUserId) : false;
                        const lastSeenText = otherUser ? formatLastSeen(otherUser.lastSeenAt, isOnline) : '';
                        return lastSeenText ? (
                          <p className="text-xs text-muted-foreground truncate" data-testid="text-last-seen">
                            {lastSeenText}
                          </p>
                        ) : null;
                      })()}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Show invite and cancel buttons if call is active, otherwise show call buttons */}
                {(outgoingCall || activeCall) ? (
                  <>
                    {/* Cancel/End Call Button - Desktop */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const conversationId = outgoingCall?.conversationId || activeCall?.conversationId;
                        // Send WebSocket event to notify receiver that call was cancelled/ended
                        if (ws?.send && conversationId) {
                          ws.send({
                            type: 'call_cancelled',
                            data: {
                              conversationId,
                            },
                          });
                        }
                        
                        setOutgoingCall(null);
                        setActiveCall(null);
                        if (callWindowRef.current && !callWindowRef.current.closed) {
                          callWindowRef.current.close();
                        }
                        toast({
                          title: activeCall ? 'Call ended' : 'Call cancelled',
                          description: activeCall ? 'You left the call' : 'You ended the call',
                        });
                      }}
                      className="hidden md:flex"
                      data-testid="button-cancel-call"
                    >
                      <PhoneOff className="w-4 h-4 mr-2" />
                      {activeCall ? 'End Call' : 'Cancel Call'}
                    </Button>
                    {/* Cancel/End Call Button - Mobile */}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        const conversationId = outgoingCall?.conversationId || activeCall?.conversationId;
                        // Send WebSocket event to notify receiver that call was cancelled/ended
                        if (ws?.send && conversationId) {
                          ws.send({
                            type: 'call_cancelled',
                            data: {
                              conversationId,
                            },
                          });
                        }
                        
                        setOutgoingCall(null);
                        setActiveCall(null);
                        if (callWindowRef.current && !callWindowRef.current.closed) {
                          callWindowRef.current.close();
                        }
                        toast({
                          title: activeCall ? 'Call ended' : 'Call cancelled',
                          description: activeCall ? 'You left the call' : 'You ended the call',
                        });
                      }}
                      className="md:hidden h-9 w-9"
                      data-testid="button-cancel-call-mobile"
                      title={activeCall ? "End call" : "Cancel call"}
                    >
                      <PhoneOff className="w-4 h-4" />
                    </Button>
                    {/* Invite to Call Button - Desktop */}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsInviteToCallOpen(true)}
                      className="hidden md:flex"
                      data-testid="button-invite-to-call"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite
                    </Button>
                    {/* Invite to Call Button - Mobile */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsInviteToCallOpen(true)}
                      className="md:hidden h-9 w-9"
                      data-testid="button-invite-to-call-mobile"
                      title="Invite to call"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Audio Call Button - Desktop */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStartAudioCall}
                      className="hidden md:flex h-9 w-9"
                      data-testid="button-audio-call"
                      title="Start audio call"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    
                    {/* Video Call Button - Desktop */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStartCall}
                      className="hidden md:flex h-9 w-9"
                      data-testid="button-video-call"
                      title="Start video call"
                    >
                      <Video className="w-4 h-4" />
                    </Button>

                    {/* Mobile: Combined call buttons */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStartAudioCall}
                      className="md:hidden h-9 w-9"
                      data-testid="button-audio-call-mobile"
                      title="Audio call"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStartCall}
                      className="md:hidden h-9 w-9"
                      data-testid="button-video-call-mobile"
                      title="Video call"
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  </>
                )}
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

            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-3 md:px-6 py-4"
            >
              <div className="max-w-4xl mx-auto">
                {activeMessages.map((msg) => (
                  <Message
                    key={msg.id}
                    {...msg}
                    isCurrentUser={msg.senderId === currentUser.id}
                    onEdit={handleEditMessage}
                    onForward={handleForwardMessage}
                    onReply={handleReply}
                    onDelete={handleDeleteMessage}
                  />
                ))}
                {isTyping && <TypingIndicator userName="Someone" />}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="flex-shrink-0">
              <MessageInput
                onSendMessage={(body, attachmentUrl, replyToId) => {
                  if (activeConversationId) {
                    onSendMessage(activeConversationId, body, attachmentUrl, replyToId);
                    setReplyingTo(null);
                  }
                }}
                onTyping={setIsTyping}
                onFileUpload={onFileUpload}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Mobile: Show conversation list when no conversation selected */}
            <div className="md:hidden flex flex-col h-full">
              <div className="min-h-[64px] border-b border-border flex items-center justify-between px-4 flex-shrink-0 bg-secondary">
                <div className="flex items-center gap-3">
                  <img src={logoImage} alt="SUPREMO TRADERS Logo" className="w-9 h-9 object-contain rounded" />
                  <div>
                    <h1 className="text-sm font-bold text-secondary-foreground">SUPREMO TRADERS</h1>
                    <p className="text-xs text-secondary-foreground/70 font-medium">Team Chat</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(true)}
                  data-testid="button-mobile-menu-empty"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-3 border-b border-border bg-background">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 text-base"
                    data-testid="input-search-mobile-empty"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <h3 className="text-sm font-semibold mb-1 text-foreground">No conversations yet</h3>
                      <p className="text-xs text-muted-foreground mb-4">Start chatting with your team</p>
                      <Button
                        onClick={() => setIsNewConversationOpen(true)}
                        size="sm"
                        className="mx-auto"
                        data-testid="button-start-first-conversation"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Start Conversation
                      </Button>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => {
                      const isDirectMessage = !conv.isGroup;
                      const otherUserId = isDirectMessage ? conv.memberIds?.find(id => id !== currentUser.id) : null;
                      const isOnline = otherUserId ? onlineUserIds.includes(otherUserId) : false;

                      return (
                        <ConversationItem
                          key={conv.id}
                          id={conv.id}
                          title={conv.title}
                          members={conv.members}
                          isGroup={conv.isGroup}
                          lastMessage={conv.lastMessage}
                          lastMessageTime={conv.lastMessageTime}
                          unreadCount={conv.unreadCount}
                          isActive={activeConversationId === conv.id}
                          avatarUrl={conv.avatarUrl}
                          isOnline={isOnline}
                          isPinned={pinnedConversationIds.includes(conv.id)}
                          onPinToggle={(id) => {
                            if (pinnedConversationIds.includes(id)) {
                              unpinMutation.mutate(id);
                            } else {
                              pinMutation.mutate(id);
                            }
                          }}
                          onAudioCall={handleQuickAudioCall}
                          onClick={() => {
                            setActiveConversationId(conv.id);
                            onConversationSelect?.(conv.id);
                            onMarkConversationAsRead?.(conv.id);
                          }}
                        />
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Floating Action Button for New Conversation - Mobile only */}
              <div className="fixed bottom-6 right-6 z-50">
                <button
                  onClick={() => setIsNewConversationOpen(true)}
                  className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
                  data-testid="button-fab-new-conversation"
                  aria-label="New Conversation"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Desktop: Show empty state */}
            <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
                <p className="text-sm mb-4">Choose a conversation or start a new one</p>
                <Button
                  onClick={() => setIsNewConversationOpen(true)}
                  data-testid="button-start-conversation-desktop"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
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

      {isMobileMenuOpen && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-[90vw] max-w-sm p-0 bg-background">
            <div className="flex flex-col h-full">
            <div className="min-h-[72px] border-b border-border flex items-center justify-between px-4 py-3 bg-secondary">
              <div className="flex items-center gap-3">
                <img src={logoImage} alt="SUPREMO TRADERS Logo" className="w-10 h-10 object-contain rounded" />
                <div>
                  <h1 className="text-base font-bold text-secondary-foreground">SUPREMO TRADERS</h1>
                  <p className="text-xs text-secondary-foreground/70 font-medium">Team Chat</p>
                </div>
              </div>
            </div>

            <div className="p-3 border-b border-border">
              <div className="grid grid-cols-2 gap-2 p-2 bg-muted/50 rounded-xl">
                <Button
                  variant={currentView === 'chat' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('chat'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-chat-mobile"
                  className="h-11 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Chat
                </Button>
                <Button
                  variant={currentView === 'tasks' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('tasks'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-tasks-mobile"
                  className="h-11 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Tasks
                </Button>
                <Button
                  variant={currentView === 'todo' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('todo'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-todo-mobile"
                  className="h-11 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                  <ListChecks className="w-4 h-4 mr-1.5" />
                  To-Do
                </Button>
                <Button
                  variant={currentView === 'calendar' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('calendar'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-calendar-mobile"
                  className="h-11 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                  <CalendarIcon className="w-4 h-4 mr-1.5" />
                  Calendar
                </Button>
                <Button
                  variant={currentView === 'worksheet' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('worksheet'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-worksheet-mobile"
                  className="h-11 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  Work Log
                </Button>
                <Button
                  variant={currentView === 'projects' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('projects'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-projects-mobile"
                  className="h-11 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                  <Folder className="w-4 h-4 mr-1.5" />
                  Projects
                </Button>
                <Button
                  variant={currentView === 'drive' ? 'default' : 'ghost'}
                  onClick={() => { setCurrentView('drive'); setIsMobileMenuOpen(false); }}
                  data-testid="button-view-drive-mobile"
                  className="h-11 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                  <HardDrive className="w-4 h-4 mr-1.5" />
                  Supremo Drive
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant={currentView === 'admin' ? 'default' : 'ghost'}
                      onClick={() => { setCurrentView('admin'); setIsMobileMenuOpen(false); }}
                      data-testid="button-view-admin-mobile"
                      className="h-11 text-sm font-semibold col-span-2 rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                    >
                      <Shield className="w-4 h-4 mr-1.5" />
                      Admin Panel
                    </Button>
                    <Button
                      variant={currentView === 'admin-worksheets' ? 'default' : 'outline'}
                      onClick={() => { setCurrentView('admin-worksheets'); setIsMobileMenuOpen(false); }}
                      data-testid="button-view-admin-worksheets-mobile"
                      className="h-11 text-sm font-semibold col-span-2 rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                    >
                      <FileText className="w-4 h-4 mr-1.5" />
                      Team Work Logs
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
                        onAudioCall={handleQuickAudioCall}
                        onClick={() => {
                          setActiveConversationId(conv.id);
                          onConversationSelect?.(conv.id);
                          onMarkConversationAsRead?.(conv.id);
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
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          isOpen={true}
          callerName={incomingCall.from.name}
          callerAvatar={incomingCall.from.avatar}
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Edit Message Dialog */}
      <EditMessageDialog
        isOpen={!!editingMessage}
        messageId={editingMessage?.id || 0}
        currentBody={editingMessage?.body || ''}
        onClose={() => setEditingMessage(null)}
        onMessageEdited={handleMessageEdited}
      />

      {/* Forward Message Dialog */}
      <ForwardMessageDialog
        isOpen={!!forwardingMessageId}
        messageId={forwardingMessageId || 0}
        conversations={conversations}
        currentConversationId={activeConversationId || 0}
        onClose={() => setForwardingMessageId(null)}
      />

      {/* Invite to Call Dialog */}
      {(outgoingCall || activeCall) && (
        <InviteToCallDialog
          isOpen={isInviteToCallOpen}
          onClose={() => setIsInviteToCallOpen(false)}
          currentUserId={currentUser.id}
          conversationId={outgoingCall?.conversationId || activeCall!.conversationId}
          callType={outgoingCall?.callType || activeCall!.callType}
          roomName={outgoingCall 
            ? (outgoingCall.callType === 'video' 
                ? `supremo-video-${outgoingCall.conversationId}`
                : `supremo-audio-${outgoingCall.conversationId}`)
            : activeCall!.roomName
          }
          allUsers={allUsers}
          conversationMemberIds={
            conversations.find(c => c.id === (outgoingCall?.conversationId || activeCall!.conversationId))?.memberIds || []
          }
          onSendInvite={handleSendCallInvite}
        />
      )}
    </div>
  );
}

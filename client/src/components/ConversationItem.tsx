import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, CheckCheck, Pin, PinOff } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface ConversationItemProps {
  id: number;
  title?: string;
  members: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isActive?: boolean;
  avatarUrl?: string;
  isOnline?: boolean;
  isPinned?: boolean;
  onPinToggle?: (id: number) => void;
  onClick: () => void;
}

const getColorForName = (name: string) => {
  const colors = [
    'bg-gradient-to-br from-purple-500 to-blue-500',
    'bg-gradient-to-br from-blue-500 to-cyan-500',
    'bg-gradient-to-br from-cyan-500 to-teal-500',
    'bg-gradient-to-br from-teal-500 to-emerald-500',
    'bg-gradient-to-br from-pink-500 to-rose-500',
    'bg-gradient-to-br from-orange-500 to-amber-500',
    'bg-gradient-to-br from-indigo-500 to-purple-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d');
  }
};

export default function ConversationItem({
  id,
  title,
  members,
  isGroup,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  isActive = false,
  avatarUrl,
  isOnline = false,
  isPinned = false,
  onPinToggle,
  onClick,
}: ConversationItemProps) {
  const displayName = title || members;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasUnread = unreadCount > 0;

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPinToggle) {
      onPinToggle(id);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 shadow-md' 
          : 'hover-elevate active-elevate-2'
      }`}
      data-testid={`conversation-item-${displayName}`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-purple-600 to-blue-600 rounded-r-full" />
      )}

      <div className="relative flex-shrink-0">
        <Avatar className={`w-12 h-12 border-2 ${isActive ? 'border-purple-400 dark:border-purple-600' : 'border-transparent'} transition-all`}>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className={`text-sm font-semibold text-white ${getColorForName(displayName)}`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        {isGroup && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center border-2 border-background shadow-sm">
            <Users className="w-3 h-3 text-white" />
          </div>
        )}
        {/* Online status indicator for direct messages */}
        {!isGroup && isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {isPinned && <Pin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />}
            <h3 className={`font-semibold text-sm truncate ${hasUnread ? 'text-foreground' : 'text-foreground/80'}`}>
              {displayName}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onPinToggle && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePinClick}
                className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${isPinned ? 'opacity-100' : ''}`}
                data-testid="button-pin-toggle"
              >
                {isPinned ? (
                  <PinOff className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Pin className="w-3.5 h-3.5 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400" />
                )}
              </Button>
            )}
            {lastMessageTime && (
              <span className={`text-xs ${hasUnread ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-muted-foreground'}`}>
                {formatTimestamp(lastMessageTime)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {lastMessage && !hasUnread && (
              <CheckCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            )}
            <p className={`text-sm truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {lastMessage || 'No messages yet'}
            </p>
          </div>
          {hasUnread && (
            <Badge
              variant="default"
              className="flex-shrink-0 min-w-[22px] h-5.5 px-2 text-xs justify-center bg-gradient-to-r from-purple-600 to-blue-600 border-0 font-semibold shadow-sm"
              data-testid="badge-unread"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-200 pointer-events-none ${isActive ? 'opacity-0' : ''}`} />
    </div>
  );
}

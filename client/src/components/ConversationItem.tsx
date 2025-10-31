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
    'bg-primary',
    'bg-blue-600',
    'bg-cyan-600',
    'bg-teal-600',
    'bg-rose-600',
    'bg-amber-600',
    'bg-indigo-600',
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
          ? 'bg-primary/10 dark:bg-primary/20 shadow-sm border border-primary/20' 
          : 'hover-elevate active-elevate-2'
      }`}
      data-testid={`conversation-item-${displayName}`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-full" />
      )}

      <div className="relative flex-shrink-0">
        <Avatar className={`w-12 h-12 border-2 ${isActive ? 'border-primary/50' : 'border-transparent'} transition-all`}>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className={`text-sm font-semibold text-white ${getColorForName(displayName)}`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        {isGroup && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-sm">
            <Users className="w-3 h-3 text-primary-foreground" />
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
            {isPinned && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
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
                aria-pressed={isPinned}
                aria-label={isPinned ? "Unpin conversation" : "Pin conversation"}
              >
                {isPinned ? (
                  <PinOff className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Pin className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                )}
              </Button>
            )}
            {lastMessageTime && (
              <span className={`text-xs ${hasUnread ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
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
              className="flex-shrink-0 min-w-[22px] h-5.5 px-2 text-xs justify-center border-0 font-semibold shadow-sm"
              data-testid="badge-unread"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users } from 'lucide-react';
import { format } from 'date-fns';

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
  onClick: () => void;
}

export default function ConversationItem({
  title,
  members,
  isGroup,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  isActive = false,
  avatarUrl,
  onClick,
}: ConversationItemProps) {
  const displayName = title || members;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={onClick}
      className={`flex gap-3 p-3 rounded-lg cursor-pointer hover-elevate active-elevate-2 ${
        isActive ? 'bg-accent' : ''
      }`}
      data-testid={`conversation-item-${displayName}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-sm">{initials}</AvatarFallback>
        </Avatar>
        {isGroup && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <Users className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {displayName}
          </h3>
          {lastMessageTime && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {format(new Date(lastMessageTime), 'h:mm a')}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground truncate">
            {lastMessage || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="flex-shrink-0 min-w-[20px] h-5 px-1.5 text-xs justify-center"
              data-testid="badge-unread"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

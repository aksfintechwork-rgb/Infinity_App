import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { FileText, Download, MoreVertical, Edit2, Forward, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageProps {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  body?: string;
  attachmentUrl?: string;
  createdAt: string;
  editedAt?: string | null;
  isCurrentUser?: boolean;
  replyToId?: number | null;
  repliedToMessage?: {
    senderName: string;
    body?: string;
  } | null;
  onEdit?: (messageId: number, currentBody: string) => void;
  onForward?: (messageId: number) => void;
  onReply?: (messageId: number, senderName: string) => void;
}

export default function Message({
  id,
  senderName,
  senderAvatar,
  body,
  attachmentUrl,
  createdAt,
  editedAt,
  isCurrentUser = false,
  replyToId,
  repliedToMessage,
  onEdit,
  onForward,
  onReply,
}: MessageProps) {
  const initials = senderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fileName = attachmentUrl?.split('/').pop() || 'file';
  const isImage = attachmentUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = attachmentUrl?.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <div className="flex gap-3 mb-4 group">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={senderAvatar} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-sm text-foreground" data-testid={`text-sender-${senderName}`}>
            {senderName}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-muted-foreground">(you)</span>
          )}
          <span className="text-xs text-muted-foreground">
            {format(new Date(createdAt), 'h:mm a')}
          </span>
          {editedAt && (
            <span className="text-xs text-muted-foreground italic" data-testid="text-edited-indicator">
              (edited)
            </span>
          )}
          
          <div className="invisible group-hover:visible">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  data-testid={`button-message-menu-${id}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onReply?.(id, senderName)}
                  data-testid={`button-reply-message-${id}`}
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </DropdownMenuItem>
                {isCurrentUser && body && (
                  <DropdownMenuItem
                    onClick={() => onEdit?.(id, body)}
                    data-testid={`button-edit-message-${id}`}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onForward?.(id)}
                  data-testid={`button-forward-message-${id}`}
                >
                  <Forward className="mr-2 h-4 w-4" />
                  Forward
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {repliedToMessage && (
          <div className="mb-2 pl-3 border-l-2 border-primary/40 py-1 bg-muted/30 rounded-r text-xs">
            <span className="font-semibold text-primary">@{repliedToMessage.senderName}</span>
            {repliedToMessage.body && (
              <p className="text-muted-foreground truncate mt-0.5">{repliedToMessage.body}</p>
            )}
          </div>
        )}
        
        {body && (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-message-body">
            {body}
          </p>
        )}
        
        {attachmentUrl && (
          <div className="mt-2">
            {isImage ? (
              <a 
                href={attachmentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
                data-testid="link-image-attachment"
              >
                <img
                  src={attachmentUrl}
                  alt="Attachment"
                  className="rounded-lg border border-border hover-elevate cursor-pointer"
                  style={{ 
                    maxWidth: '500px',
                    width: 'auto',
                    height: 'auto',
                    maxHeight: '450px',
                    minWidth: '200px',
                    display: 'block'
                  }}
                  data-testid="img-attachment"
                  loading="eager"
                />
              </a>
            ) : isVideo ? (
              <video
                controls
                className="rounded-lg border border-border"
                style={{ 
                  maxWidth: '500px',
                  width: '100%',
                  maxHeight: '450px',
                }}
                data-testid="video-attachment"
              >
                <source src={attachmentUrl} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <a 
                href={attachmentUrl} 
                download
                className="block max-w-sm"
                data-testid="link-file-attachment"
              >
                <div className="flex items-center gap-3 p-3 bg-card border border-card-border rounded-lg hover-elevate active-elevate-2 cursor-pointer">
                  <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">Click to download</p>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </div>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

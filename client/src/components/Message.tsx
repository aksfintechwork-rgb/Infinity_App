import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageProps {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  body?: string;
  attachmentUrl?: string;
  createdAt: string;
  isCurrentUser?: boolean;
}

export default function Message({
  senderName,
  senderAvatar,
  body,
  attachmentUrl,
  createdAt,
  isCurrentUser = false,
}: MessageProps) {
  const initials = senderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fileName = attachmentUrl?.split('/').pop() || 'file';
  const isImage = attachmentUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className="flex gap-3 mb-4">
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
        </div>
        
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

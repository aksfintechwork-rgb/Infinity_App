import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Paperclip, Smile, FileText, Image as ImageIcon, File } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (body: string, attachmentUrl?: string, replyToId?: number) => void;
  onTyping: (isTyping: boolean) => void;
  onFileUpload: (file: File) => Promise<string>;
  replyingTo?: { id: number; senderName: string; body?: string } | null;
  onCancelReply?: () => void;
}

const EMOJI_GROUPS = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '💪', '🙏', '✍️', '👏', '🙌'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['💼', '📱', '💻', '⌚', '📷', '📹', '🎥', '📞', '☎️', '📠', '📺', '📻', '🎵', '🎶', '🎤', '🎧', '📢', '📣', '📯', '🔔', '🔕', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '✉️', '📃', '📄', '📑', '📊', '📈', '📉'],
  'Symbols': ['✅', '❌', '⭐', '🌟', '💯', '🔥', '⚡', '💥', '✨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚠️', '🚫', '🔴', '🟢', '🔵', '⚪', '⚫', '🟣', '🟡', '🟠'],
};

export default function MessageInput({ onSendMessage, onTyping, onFileUpload, replyingTo, onCancelReply }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string; type: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    onTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message, undefined, replyingTo?.id);
      setMessage('');
      onTyping(false);
      onCancelReply?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await onFileUpload(file);
        uploadedFiles.push({
          url,
          name: file.name,
          type: file.type
        });
      }
      setPendingAttachments(uploadedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmAttachment = () => {
    if (pendingAttachments.length > 0) {
      pendingAttachments.forEach((attachment) => {
        onSendMessage('', attachment.url, replyingTo?.id);
      });
      setPendingAttachments([]);
      onCancelReply?.();
    }
  };

  const handleCancelAttachment = () => {
    setPendingAttachments([]);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="w-12 h-12 text-primary" />;
    } else if (type.includes('pdf')) {
      return <FileText className="w-12 h-12 text-red-500" />;
    } else {
      return <File className="w-12 h-12 text-blue-500" />;
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + emoji + message.substring(end);
    
    setMessage(newMessage);
    setIsEmojiOpen(false);
    
    // Focus back on textarea and set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="border-t border-border bg-background p-3 md:p-4">
      {replyingTo && (
        <div className="mb-2 px-3 py-2 bg-muted/50 rounded-lg flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-primary mb-0.5">
              Replying to @{replyingTo.senderName}
            </div>
            {replyingTo.body && (
              <div className="text-xs text-muted-foreground truncate">
                {replyingTo.body}
              </div>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancelReply}
            className="h-6 w-6 flex-shrink-0"
            data-testid="button-cancel-reply"
          >
            <span className="text-lg leading-none">&times;</span>
          </Button>
        </div>
      )}
      
      <div className="flex gap-2 mb-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-testid="button-attach-file"
          className="h-10 w-10 md:h-9 md:w-9"
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
          <PopoverTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              data-testid="button-emoji"
              className="h-10 w-10 md:h-9 md:w-9"
            >
              <Smile className="w-5 h-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(EMOJI_GROUPS).map(([category, emojis]) => (
                <div key={category} className="mb-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">{category}</h4>
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-2xl hover:bg-accent rounded p-1 transition-colors"
                        data-testid={`emoji-${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="resize-none min-h-[48px] md:min-h-[44px] max-h-32 text-base"
          rows={1}
          data-testid="textarea-message"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isUploading}
          className="flex-shrink-0 h-12 md:h-10 px-4 md:px-3 text-base md:text-sm font-semibold"
          data-testid="button-send"
        >
          <Send className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Send</span>
          <span className="sm:hidden">Send</span>
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
        multiple
      />

      <Dialog open={pendingAttachments.length > 0} onOpenChange={(open) => !open && handleCancelAttachment()}>
        <DialogContent data-testid="dialog-confirm-attachment">
          <DialogHeader>
            <DialogTitle>Send {pendingAttachments.length} {pendingAttachments.length === 1 ? 'Attachment' : 'Attachments'}?</DialogTitle>
            <DialogDescription>
              Do you want to post {pendingAttachments.length === 1 ? 'this file' : 'these files'} to the chat?
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-64 overflow-y-auto space-y-3 py-4">
            {pendingAttachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {attachment.type.split('/')[0] === 'image' ? 'Image' : 
                     attachment.type.split('/')[0] === 'video' ? 'Video' :
                     attachment.type.includes('pdf') ? 'PDF Document' :
                     attachment.type.includes('sheet') || attachment.type.includes('excel') ? 'Excel File' : 'Document'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelAttachment}
              data-testid="button-cancel-attachment"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAttachment}
              data-testid="button-confirm-attachment"
            >
              Send to Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

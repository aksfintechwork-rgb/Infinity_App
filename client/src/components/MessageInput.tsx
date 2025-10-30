import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (body: string, attachmentUrl?: string) => void;
  onTyping: (isTyping: boolean) => void;
  onFileUpload: (file: File) => Promise<string>;
}

export default function MessageInput({ onSendMessage, onTyping, onFileUpload }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

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
      onSendMessage(message);
      setMessage('');
      onTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await onFileUpload(file);
      onSendMessage('', url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="border-t border-border bg-background p-3 md:p-4">
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
        <Button 
          size="icon" 
          variant="ghost" 
          data-testid="button-emoji"
          className="h-10 w-10 md:h-9 md:w-9"
        >
          <Smile className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex gap-2 items-end">
        <Textarea
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
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
}

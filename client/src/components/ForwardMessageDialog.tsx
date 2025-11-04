import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Conversation {
  id: number;
  title?: string;
  members: string;
  isGroup: boolean;
  avatarUrl?: string;
}

interface ForwardMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: number;
  conversations: Conversation[];
  currentConversationId: number;
}

export default function ForwardMessageDialog({
  isOpen,
  onClose,
  messageId,
  conversations,
  currentConversationId,
}: ForwardMessageDialogProps) {
  const [selectedConversations, setSelectedConversations] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const availableConversations = conversations.filter(
    (conv) => conv.id !== currentConversationId
  );

  const toggleConversation = (conversationId: number) => {
    setSelectedConversations((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleSubmit = async () => {
    if (selectedConversations.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one conversation',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/messages/forward', {
        messageId,
        conversationIds: selectedConversations,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Message forwarded to ${data.forwardedCount} conversation(s)`,
        });
        setSelectedConversations([]);
        onClose();
      } else {
        throw new Error(data.error || 'Failed to forward message');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to forward message',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-forward-message">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          {availableConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No other conversations available
            </p>
          ) : (
            <div className="space-y-2">
              {availableConversations.map((conv) => {
                const initials = (conv.title || conv.members)
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={conv.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => toggleConversation(conv.id)}
                    data-testid={`conversation-${conv.id}`}
                  >
                    <Checkbox
                      checked={selectedConversations.includes(conv.id)}
                      onCheckedChange={() => toggleConversation(conv.id)}
                      data-testid={`checkbox-conversation-${conv.id}`}
                    />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={conv.avatarUrl} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.title || conv.members}
                      </p>
                      {conv.isGroup && (
                        <p className="text-xs text-muted-foreground">Group</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="button-cancel-forward"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedConversations.length === 0}
            data-testid="button-forward"
          >
            {isSubmitting ? 'Forwarding...' : `Forward to ${selectedConversations.length || ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

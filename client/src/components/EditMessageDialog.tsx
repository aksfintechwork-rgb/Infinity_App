import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface EditMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: number;
  currentBody: string;
  onMessageEdited: (messageId: number, newBody: string, editedAt: Date) => void;
}

export default function EditMessageDialog({
  isOpen,
  onClose,
  messageId,
  currentBody,
  onMessageEdited,
}: EditMessageDialogProps) {
  const [body, setBody] = useState(currentBody);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Sync local body state when messageId or currentBody changes
  useEffect(() => {
    setBody(currentBody);
  }, [messageId, currentBody]);

  const handleSubmit = async () => {
    if (!body.trim()) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('PATCH', `/api/messages/${messageId}`, {
        body: body.trim(),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onMessageEdited(messageId, data.body, new Date(data.editedAt));
        toast({
          title: 'Success',
          description: 'Message edited successfully',
        });
        onClose();
      } else {
        throw new Error(data.error || 'Failed to edit message');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to edit message',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-edit-message">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Edit your message..."
            rows={4}
            className="resize-none"
            data-testid="input-edit-message"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            data-testid="button-save-edit"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

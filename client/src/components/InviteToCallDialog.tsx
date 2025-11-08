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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Link2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface User {
  id: number;
  name: string;
  loginId: string;
  email?: string;
  role: string;
  avatar?: string;
}

interface InviteToCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  conversationId: number;
  callType: 'audio' | 'video';
  roomName: string;
  roomUrl?: string;
  allUsers: User[];
  conversationMemberIds: number[];
  onSendInvite: (userId: number) => void;
}

export default function InviteToCallDialog({
  isOpen,
  onClose,
  currentUserId,
  conversationId,
  callType,
  roomName,
  roomUrl,
  allUsers,
  conversationMemberIds,
  onSendInvite,
}: InviteToCallDialogProps) {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Filter users: exclude only current user (allow inviting anyone to the call)
  const availableUsers = allUsers.filter(
    (user) => user.id !== currentUserId
  );

  const toggleUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select at least one person to invite',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      // Send invite to each selected user
      for (const userId of selectedUsers) {
        onSendInvite(userId);
      }

      toast({
        title: 'Invitations sent',
        description: `Invited ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'} to the call`,
      });

      setSelectedUsers([]);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitations',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCopyLink = () => {
    if (!roomUrl) return;
    
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    toast({
      title: 'Link copied',
      description: 'Meeting link copied to clipboard',
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-invite-to-call">
        <DialogHeader>
          <DialogTitle>Invite to {callType === 'video' ? 'Video' : 'Audio'} Call</DialogTitle>
        </DialogHeader>

        {/* Shareable Meeting Link */}
        {roomUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link2 className="w-4 h-4" />
              Share Meeting Link
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 text-sm bg-muted rounded-md truncate">
                {roomUrl}
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
                data-testid="button-copy-meeting-link"
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can join the meeting
            </p>
            <Separator className="my-4" />
          </div>
        )}

        {availableUsers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">All team members are already in this conversation</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-3">
              Select team members to invite to this call
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-md hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => toggleUser(user.id)}
                    data-testid={`user-item-${user.id}`}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                      data-testid={`checkbox-user-${user.id}`}
                    />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.loginId}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSending}
                data-testid="button-cancel-invite"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={selectedUsers.length === 0 || isSending}
                data-testid="button-send-invite"
              >
                {isSending ? 'Sending...' : `Invite ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

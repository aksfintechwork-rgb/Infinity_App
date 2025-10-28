import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  users: User[];
  onCreateConversation: (title: string, memberIds: number[]) => void;
}

export default function NewConversationModal({
  open,
  onClose,
  users,
  onCreateConversation,
}: NewConversationModalProps) {
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (selectedUserIds.length === 0) return;
    
    const conversationTitle = selectedUserIds.length > 1 ? title : '';
    onCreateConversation(conversationTitle, selectedUserIds);
    
    setTitle('');
    setSearchQuery('');
    setSelectedUserIds([]);
    onClose();
  };

  const handleCancel = () => {
    setTitle('');
    setSearchQuery('');
    setSelectedUserIds([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Select team members to start a conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {selectedUserIds.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="conversation-title">Group Name (optional)</Label>
              <Input
                id="conversation-title"
                placeholder="e.g., Sales Team"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-conversation-title"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Select Members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-members"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-2">
            {filteredUsers.map((user) => {
              const initials = user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                  onClick={() => handleToggleUser(user.id)}
                  data-testid={`user-item-${user.id}`}
                >
                  <Checkbox
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={() => handleToggleUser(user.id)}
                  />
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">
            {selectedUserIds.length} member{selectedUserIds.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} data-testid="button-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedUserIds.length === 0}
            data-testid="button-create-conversation"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

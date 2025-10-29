import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
}

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMembers: (memberIds: number[], canViewHistory: boolean) => void;
  availableUsers: User[];
  conversationTitle: string;
}

export default function AddMembersModal({
  isOpen,
  onClose,
  onAddMembers,
  availableUsers,
  conversationTitle,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [canViewHistory, setCanViewHistory] = useState(false);

  const filteredUsers = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAdd = () => {
    if (selectedUserIds.length === 0) return;
    onAddMembers(selectedUserIds, canViewHistory);
    setSelectedUserIds([]);
    setCanViewHistory(false);
    setSearchQuery('');
    onClose();
  };

  const handleCancel = () => {
    setSelectedUserIds([]);
    setCanViewHistory(false);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            Add Members to "{conversationTitle}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Select members to add ({selectedUserIds.length} selected)
            </Label>
            <ScrollArea className="h-64 rounded-md border border-border">
              <div className="p-2 space-y-1">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No users found
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-md hover-elevate active-elevate-2 cursor-pointer"
                      onClick={() => handleUserToggle(user.id)}
                      data-testid={`user-item-${user.id}`}
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                        data-testid={`checkbox-user-${user.id}`}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        {user.email && (
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md border border-border bg-muted/50">
            <Checkbox
              id="view-history"
              checked={canViewHistory}
              onCheckedChange={(checked) => setCanViewHistory(checked === true)}
              data-testid="checkbox-view-history"
            />
            <div className="flex-1">
              <Label
                htmlFor="view-history"
                className="text-sm font-medium cursor-pointer"
              >
                Give access to message history
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Allow new members to view messages sent before they joined. If unchecked, they will only see new messages from when they join.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={selectedUserIds.length === 0}
              className="flex-1"
              data-testid="button-add-members"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : 'Members'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

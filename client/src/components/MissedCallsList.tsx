import { useState, useEffect } from 'react';
import { PhoneOff, Phone, PhoneMissed, Trash2, Check, MoreVertical, X } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

type MissedCall = {
  id: number;
  callerId: number;
  receiverId: number;
  conversationId: number | null;
  callType: string;
  missedAt: Date;
  viewed: boolean;
  viewedAt: Date | null;
  callerName: string;
  callerAvatar: string | null;
};

interface MissedCallsListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCallBack: (callerId: number, conversationId: number | null, callType: string) => void;
}

export function MissedCallsList({ open, onOpenChange, onCallBack }: MissedCallsListProps) {
  const { data: missedCalls = [] } = useQuery<MissedCall[]>({
    queryKey: ['/api/missed-calls'],
  });

  const markViewedMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/missed-calls/${id}/viewed`, {});
      if (!response.ok) throw new Error('Failed to mark as viewed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missed-calls'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/missed-calls/${id}`, {});
      if (!response.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missed-calls'] });
      toast({
        title: 'Deleted',
        description: 'Missed call removed',
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/missed-calls', {});
      if (!response.ok) throw new Error('Failed to clear all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missed-calls'] });
      toast({
        title: 'Cleared',
        description: 'All missed calls removed',
      });
    },
  });

  // Auto-mark feature removed - users can manually mark calls as read using the "Mark Read" button

  const handleCallBack = (callerId: number, conversationId: number | null, callType: string, missedCallId: number) => {
    // Optimistically mark as viewed
    markViewedMutation.mutate(missedCallId);
    
    // Close the sheet and initiate callback
    onOpenChange(false);
    onCallBack(callerId, conversationId, callType);
  };

  const handleMarkViewed = (id: number) => {
    markViewedMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleClearAll = () => {
    if (missedCalls.length === 0) return;
    
    if (window.confirm(`Are you sure you want to clear all ${missedCalls.length} missed call${missedCalls.length > 1 ? 's' : ''}?`)) {
      clearAllMutation.mutate();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[500px]" data-testid="sheet-missed-calls">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <PhoneOff className="w-5 h-5 text-destructive" />
              Missed Calls
              {missedCalls.length > 0 && (
                <Badge variant="secondary">
                  {missedCalls.length}
                </Badge>
              )}
            </SheetTitle>
            {missedCalls.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                disabled={clearAllMutation.isPending}
                className="gap-2"
                data-testid="button-clear-all"
              >
                <X className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {missedCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PhoneMissed className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No missed calls</p>
            </div>
          ) : (
            missedCalls.map((call) => (
              <Card key={call.id} className={call.viewed ? '' : 'border-primary/50'} data-testid={`missed-call-${call.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{call.callerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{call.callerName}</p>
                        <Badge variant={call.callType === 'video' ? 'default' : 'secondary'} className="text-xs">
                          {call.callType === 'video' ? 'Video' : 'Audio'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(call.missedAt), { addSuffix: true })}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => handleCallBack(call.callerId, call.conversationId, call.callType, call.id)}
                          className="gap-2"
                          data-testid={`button-callback-${call.id}`}
                        >
                          <Phone className="w-3 h-3" />
                          Call Back
                        </Button>
                        
                        {!call.viewed && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkViewed(call.id)}
                            disabled={markViewedMutation.isPending}
                            className="gap-2"
                            data-testid={`button-mark-viewed-${call.id}`}
                          >
                            <Check className="w-3 h-3" />
                            {markViewedMutation.isPending ? 'Marking...' : 'Mark Read'}
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="ml-auto" data-testid={`button-more-${call.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDelete(call.id)}
                              className="text-destructive"
                              data-testid={`button-delete-${call.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

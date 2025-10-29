import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, Trash2, Video, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface Meeting {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  createdBy: number;
  creatorName: string;
  createdAt: string;
}

interface CalendarProps {
  currentUser: {
    id: number;
    name: string;
    email?: string;
    role: string;
  };
}

export default function Calendar({ currentUser }: CalendarProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [activeVideoMeeting, setActiveVideoMeeting] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
  });

  const createMeeting = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      meetingLink?: string;
    }) => {
      return apiRequest('POST', '/api/meetings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setMeetingLink('');
      toast({
        title: 'Meeting created',
        description: 'Your meeting has been scheduled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create meeting',
        variant: 'destructive',
      });
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/meetings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      toast({
        title: 'Meeting deleted',
        description: 'The meeting has been removed from the calendar.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete meeting',
        variant: 'destructive',
      });
    },
  });

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !startTime || !endTime) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate meeting link is a Jitsi URL if provided
    if (meetingLink && !meetingLink.startsWith('https://meet.jit.si/')) {
      toast({
        title: 'Invalid meeting link',
        description: 'Meeting link must be a Jitsi Meet URL (https://meet.jit.si/...)',
        variant: 'destructive',
      });
      return;
    }

    createMeeting.mutate({
      title,
      description,
      startTime,
      endTime,
      meetingLink: meetingLink || undefined,
    });
  };

  const handleJoinMeeting = (link?: string) => {
    if (link) {
      // Validate it's a Jitsi link before joining
      if (!link.startsWith('https://meet.jit.si/')) {
        toast({
          title: 'Invalid meeting link',
          description: 'Only Jitsi Meet links are supported',
          variant: 'destructive',
        });
        return;
      }
      setActiveVideoMeeting(link);
    } else {
      // Generate a random Jitsi room
      const roomName = `supremo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const jitsiLink = `https://meet.jit.si/${roomName}`;
      setActiveVideoMeeting(jitsiLink);
    }
  };

  const handleGenerateMeetingLink = () => {
    const roomName = `supremo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setMeetingLink(`https://meet.jit.si/${roomName}`);
  };

  // Sort meetings by start time
  const sortedMeetings = [...meetings].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Separate upcoming and past meetings
  const now = new Date();
  const upcomingMeetings = sortedMeetings.filter(m => new Date(m.startTime) > now);
  const pastMeetings = sortedMeetings.filter(m => new Date(m.startTime) <= now);

  if (activeVideoMeeting) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            <h2 className="font-semibold">Video Meeting</h2>
          </div>
          <Button
            variant="outline"
            onClick={() => setActiveVideoMeeting(null)}
            data-testid="button-leave-meeting"
          >
            Leave Meeting
          </Button>
        </div>
        <div className="flex-1">
          <iframe
            src={activeVideoMeeting}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
            title="Video Meeting"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          <h2 className="font-semibold">Meeting Calendar</h2>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-create-meeting">
              <Plus className="w-4 h-4 mr-2" />
              New Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>
                Create a new team meeting and invite members
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMeeting}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title *</Label>
                  <Input
                    id="title"
                    placeholder="Weekly Team Sync"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-meeting-title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Discuss project updates and roadmap"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    data-testid="input-meeting-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      data-testid="input-meeting-start"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      data-testid="input-meeting-end"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingLink">Video Meeting Link (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="meetingLink"
                      placeholder="https://meet.jit.si/your-room"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      data-testid="input-meeting-link"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateMeetingLink}
                      data-testid="button-generate-link"
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only Jitsi Meet URLs are allowed (https://meet.jit.si/...)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  data-testid="button-cancel-meeting"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMeeting.isPending}
                  data-testid="button-submit-meeting"
                >
                  {createMeeting.isPending ? 'Creating...' : 'Create Meeting'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading meetings...
            </div>
          ) : (
            <>
              {upcomingMeetings.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Upcoming Meetings</h3>
                  <div className="space-y-3">
                    {upcomingMeetings.map((meeting) => (
                      <Card key={meeting.id} data-testid={`card-meeting-${meeting.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base">{meeting.title}</CardTitle>
                              {meeting.description && (
                                <CardDescription className="mt-1">
                                  {meeting.description}
                                </CardDescription>
                              )}
                            </div>
                            {(meeting.createdBy === currentUser.id || currentUser.role === 'admin') && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteMeeting.mutate(meeting.id)}
                                data-testid={`button-delete-${meeting.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>
                                {format(new Date(meeting.startTime), 'PPp')} -{' '}
                                {format(new Date(meeting.endTime), 'p')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span>Organized by {meeting.creatorName}</span>
                            </div>
                          </div>
                        </CardContent>
                        {meeting.meetingLink && (
                          <CardFooter>
                            <Button
                              className="w-full"
                              onClick={() => handleJoinMeeting(meeting.meetingLink)}
                              data-testid={`button-join-${meeting.id}`}
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Join Meeting
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {pastMeetings.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-muted-foreground">Past Meetings</h3>
                  <div className="space-y-3">
                    {pastMeetings.map((meeting) => (
                      <Card key={meeting.id} className="opacity-60" data-testid={`card-meeting-${meeting.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base">{meeting.title}</CardTitle>
                              {meeting.description && (
                                <CardDescription className="mt-1">
                                  {meeting.description}
                                </CardDescription>
                              )}
                            </div>
                            {(meeting.createdBy === currentUser.id || currentUser.role === 'admin') && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteMeeting.mutate(meeting.id)}
                                data-testid={`button-delete-${meeting.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>
                                {format(new Date(meeting.startTime), 'PPp')} -{' '}
                                {format(new Date(meeting.endTime), 'p')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span>Organized by {meeting.creatorName}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {meetings.length === 0 && (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No meetings scheduled yet</p>
                  <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-meeting">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Your First Meeting
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleJoinMeeting()}
          data-testid="button-instant-meeting"
        >
          <Video className="w-4 h-4 mr-2" />
          Start Instant Meeting
        </Button>
      </div>
    </div>
  );
}

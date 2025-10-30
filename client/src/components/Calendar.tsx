import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Plus, Trash2, Video, Clock, User, Users, Repeat, Sparkles, Copy, Languages, Pencil, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
];

interface SummaryGeneratorProps {
  meetingId: number;
  hasSummary: boolean;
  onGenerate: any;
  isGenerating: boolean;
}

function SummaryGenerator({ meetingId, hasSummary, onGenerate, isGenerating }: SummaryGeneratorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showDialog, setShowDialog] = useState(false);

  const handleGenerate = () => {
    onGenerate.mutate({ meetingId, language: selectedLanguage });
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant={hasSummary ? "outline" : "default"}
          className="flex-1"
          disabled={isGenerating}
          data-testid={`button-generate-summary-${meetingId}`}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {hasSummary ? 'Regenerate Summary' : 'Generate Summary'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Generate Meeting Summary
          </DialogTitle>
          <DialogDescription>
            Choose the language for the AI-generated summary
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="language">Summary Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger data-testid="select-summary-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The AI will generate a professional summary of the meeting in your selected language
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowDialog(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            data-testid="button-confirm-generate"
          >
            {isGenerating ? 'Generating...' : 'Generate Summary'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  participants?: { id: number; name: string }[];
  recurrencePattern?: string | null;
  recurrenceFrequency?: number | null;
  recurrenceEndDate?: string | null;
  summary?: string | null;
  summaryLanguage?: string | null;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [recurrencePattern, setRecurrencePattern] = useState<string>('none');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<number>(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [activeVideoMeeting, setActiveVideoMeeting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isCreateOpen) {
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setMeetingLink('');
      setSelectedParticipants([]);
      setRecurrencePattern('none');
      setRecurrenceFrequency(1);
      setRecurrenceEndDate('');
    }
  }, [isCreateOpen]);

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
  });

  const { data: users = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/users'],
  });

  const createMeeting = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      meetingLink?: string;
      participantIds?: number[];
      recurrencePattern?: string | null;
      recurrenceFrequency?: number | null;
      recurrenceEndDate?: string | null;
    }) => {
      return apiRequest('POST', '/api/meetings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      setIsCreateOpen(false);
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

  const updateMeeting = useMutation({
    mutationFn: async (data: {
      id: number;
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      meetingLink?: string;
      participantIds?: number[];
      recurrencePattern?: string | null;
      recurrenceFrequency?: number | null;
      recurrenceEndDate?: string | null;
    }) => {
      const { id, ...updateData } = data;
      return apiRequest('PUT', `/api/meetings/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      setIsEditOpen(false);
      setEditingMeetingId(null);
      toast({
        title: 'Meeting updated',
        description: 'Your meeting has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update meeting',
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

  const generateSummary = useMutation({
    mutationFn: async ({ meetingId, language }: { meetingId: number; language: string }) => {
      return apiRequest('POST', `/api/meetings/${meetingId}/generate-summary`, { language });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      toast({
        title: 'Summary generated',
        description: 'AI-powered meeting summary created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate summary',
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

    // Validate recurring end date if pattern is selected
    if (recurrencePattern !== 'none' && !recurrenceEndDate) {
      toast({
        title: 'Error',
        description: 'Please select an end date for recurring meetings',
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
      participantIds: selectedParticipants.length > 0 ? selectedParticipants : undefined,
      recurrencePattern: recurrencePattern || 'none',
      recurrenceFrequency: recurrencePattern !== 'none' ? recurrenceFrequency : undefined,
      recurrenceEndDate: recurrencePattern !== 'none' ? recurrenceEndDate : undefined,
    });
  };

  // Helper function to add branding-hiding config to Jitsi URL
  const addJitsiConfig = (url: string) => {
    const config = [
      'config.prejoinPageEnabled=false',
      'config.startWithAudioMuted=false',
      'config.startWithVideoMuted=false',
      'interfaceConfig.SHOW_JITSI_WATERMARK=false',
      'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
      'interfaceConfig.SHOW_BRAND_WATERMARK=false',
      'interfaceConfig.BRAND_WATERMARK_LINK=""',
      'interfaceConfig.JITSI_WATERMARK_LINK=""',
      'interfaceConfig.SHOW_POWERED_BY=false',
      'interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT=false',
      'interfaceConfig.DISPLAY_WELCOME_FOOTER=false',
      'interfaceConfig.APP_NAME="SUPREMO TRADERS"',
      'interfaceConfig.NATIVE_APP_NAME="SUPREMO TRADERS"'
    ].join('&');
    
    // Check if URL already has a hash fragment
    if (url.includes('#')) {
      return `${url}&${config}`;
    } else {
      return `${url}#${config}`;
    }
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
      setActiveVideoMeeting(addJitsiConfig(link));
    } else {
      // Generate a random Jitsi room
      const roomName = `supremo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const jitsiLink = `https://meet.jit.si/${roomName}`;
      setActiveVideoMeeting(addJitsiConfig(jitsiLink));
    }
  };

  const handleGenerateMeetingLink = () => {
    const roomName = `supremo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const baseLink = `https://meet.jit.si/${roomName}`;
    setMeetingLink(addJitsiConfig(baseLink));
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setTitle(meeting.title);
    setDescription(meeting.description || '');
    setStartTime(meeting.startTime.slice(0, 16));
    setEndTime(meeting.endTime.slice(0, 16));
    setMeetingLink(meeting.meetingLink || '');
    setSelectedParticipants(meeting.participants?.map(p => p.id) || []);
    setRecurrencePattern(meeting.recurrencePattern || 'none');
    setRecurrenceFrequency(meeting.recurrenceFrequency || 1);
    setRecurrenceEndDate(meeting.recurrenceEndDate ? meeting.recurrenceEndDate.slice(0, 10) : '');
    setIsEditOpen(true);
  };

  const handleUpdateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMeetingId || !title || !startTime || !endTime) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (meetingLink && !meetingLink.startsWith('https://meet.jit.si/')) {
      toast({
        title: 'Invalid meeting link',
        description: 'Meeting link must be a Jitsi Meet URL',
        variant: 'destructive',
      });
      return;
    }

    if (recurrencePattern !== 'none' && !recurrenceEndDate) {
      toast({
        title: 'Error',
        description: 'Please select an end date for recurring meetings',
        variant: 'destructive',
      });
      return;
    }

    updateMeeting.mutate({
      id: editingMeetingId,
      title,
      description,
      startTime,
      endTime,
      meetingLink: meetingLink || undefined,
      participantIds: selectedParticipants.length > 0 ? selectedParticipants : undefined,
      recurrencePattern: recurrencePattern || 'none',
      recurrenceFrequency: recurrencePattern !== 'none' ? recurrenceFrequency : undefined,
      recurrenceEndDate: recurrencePattern !== 'none' ? recurrenceEndDate : undefined,
    });
  };

  const handleQuickStartMeeting = (meeting: Meeting) => {
    if (meeting.meetingLink) {
      handleJoinMeeting(meeting.meetingLink);
    } else {
      const roomName = `supremo-meeting-${meeting.id}`;
      const jitsiLink = `https://meet.jit.si/${roomName}`;
      handleJoinMeeting(jitsiLink);
    }
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
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Invite Team Members
                  </Label>
                  <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                    {users.filter(u => u.id !== currentUser.id).map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`participant-${user.id}`}
                          checked={selectedParticipants.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedParticipants([...selectedParticipants, user.id]);
                            } else {
                              setSelectedParticipants(selectedParticipants.filter(id => id !== user.id));
                            }
                          }}
                          data-testid={`checkbox-participant-${user.id}`}
                        />
                        <label
                          htmlFor={`participant-${user.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {user.name} ({user.email})
                        </label>
                      </div>
                    ))}
                    {users.filter(u => u.id !== currentUser.id).length === 0 && (
                      <p className="text-sm text-muted-foreground">No other team members available</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    Recurring Meeting
                  </Label>
                  <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                    <SelectTrigger data-testid="select-recurrence-pattern">
                      <SelectValue placeholder="Select recurrence pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Does not repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recurrencePattern !== 'none' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Repeat every</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="frequency"
                          type="number"
                          min="1"
                          max="30"
                          value={recurrenceFrequency}
                          onChange={(e) => setRecurrenceFrequency(parseInt(e.target.value) || 1)}
                          className="w-20"
                          data-testid="input-recurrence-frequency"
                        />
                        <span className="text-sm text-muted-foreground">
                          {recurrencePattern === 'daily' ? 'day(s)' : recurrencePattern === 'weekly' ? 'week(s)' : 'month(s)'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Repeat until *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        data-testid="input-recurrence-end-date"
                        required
                      />
                    </div>
                  </>
                )}
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

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Meeting</DialogTitle>
              <DialogDescription>
                Update meeting details and participants
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateMeeting}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Meeting Title *</Label>
                  <Input
                    id="edit-title"
                    placeholder="Weekly Team Sync"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-edit-meeting-title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Discuss project updates and roadmap"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    data-testid="input-edit-meeting-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startTime">Start Time *</Label>
                    <Input
                      id="edit-startTime"
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      data-testid="input-edit-meeting-start"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endTime">End Time *</Label>
                    <Input
                      id="edit-endTime"
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      data-testid="input-edit-meeting-end"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-meetingLink">Jitsi Meeting Link</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-meetingLink"
                      placeholder="https://meet.jit.si/your-room-name"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      data-testid="input-edit-meeting-link"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateMeetingLink}
                      data-testid="button-edit-generate-link"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Participants</Label>
                  <ScrollArea className="h-32 border rounded-md p-2">
                    <div className="space-y-2">
                      {users
                        .filter((user) => user.id !== currentUser.id)
                        .map((user) => (
                          <div key={user.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`edit-participant-${user.id}`}
                              checked={selectedParticipants.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedParticipants([...selectedParticipants, user.id]);
                                } else {
                                  setSelectedParticipants(selectedParticipants.filter((id) => id !== user.id));
                                }
                              }}
                              data-testid={`checkbox-edit-participant-${user.id}`}
                            />
                            <label htmlFor={`edit-participant-${user.id}`} className="text-sm flex-1 cursor-pointer">
                              {user.name} ({user.email})
                            </label>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-recurrence">Recurrence</Label>
                  <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                    <SelectTrigger id="edit-recurrence" data-testid="select-edit-recurrence">
                      <SelectValue placeholder="Select recurrence pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Recurrence</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {recurrencePattern !== 'none' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-frequency">Frequency (Every X {recurrencePattern === 'daily' ? 'days' : recurrencePattern === 'weekly' ? 'weeks' : 'months'})</Label>
                      <Input
                        id="edit-frequency"
                        type="number"
                        min="1"
                        max="365"
                        value={recurrenceFrequency}
                        onChange={(e) => setRecurrenceFrequency(parseInt(e.target.value) || 1)}
                        data-testid="input-edit-recurrence-frequency"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-endDate">End Date *</Label>
                      <Input
                        id="edit-endDate"
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        data-testid="input-edit-recurrence-end-date"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  data-testid="button-cancel-edit-meeting"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMeeting.isPending}
                  data-testid="button-submit-edit-meeting"
                >
                  {updateMeeting.isPending ? 'Updating...' : 'Update Meeting'}
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
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditMeeting(meeting)}
                                  data-testid={`button-edit-${meeting.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteMeeting.mutate(meeting.id)}
                                  data-testid={`button-delete-${meeting.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
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
                            {meeting.participants && meeting.participants.length > 0 && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span data-testid={`text-participants-${meeting.id}`}>
                                  {meeting.participants.map(p => p.name).join(', ')}
                                </span>
                              </div>
                            )}
                            {meeting.recurrencePattern && meeting.recurrencePattern !== 'none' && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Repeat className="w-4 h-4" />
                                <span data-testid={`text-recurrence-${meeting.id}`}>
                                  Repeats {meeting.recurrencePattern}
                                  {meeting.recurrenceFrequency && meeting.recurrenceFrequency > 1 
                                    ? ` (every ${meeting.recurrenceFrequency} ${meeting.recurrencePattern === 'daily' ? 'days' : meeting.recurrencePattern === 'weekly' ? 'weeks' : 'months'})`
                                    : ''
                                  }
                                  {meeting.recurrenceEndDate && ` until ${format(new Date(meeting.recurrenceEndDate), 'PP')}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                          {meeting.summary && (
                            <div className="w-full p-3 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-md border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-xs font-medium text-purple-900 dark:text-purple-100">
                                  AI Summary ({meeting.summaryLanguage?.toUpperCase() || 'EN'})
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="ml-auto h-6 w-6"
                                  onClick={() => {
                                    navigator.clipboard.writeText(meeting.summary || '');
                                    toast({ title: 'Copied', description: 'Summary copied to clipboard' });
                                  }}
                                  data-testid={`button-copy-summary-${meeting.id}`}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-purple-800 dark:text-purple-200" data-testid={`text-summary-${meeting.id}`}>
                                {meeting.summary}
                              </p>
                            </div>
                          )}
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                              onClick={() => handleQuickStartMeeting(meeting)}
                              data-testid={`button-quick-start-${meeting.id}`}
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Start Meeting Now
                            </Button>
                            <div className="flex gap-2 w-full">
                              <SummaryGenerator
                                meetingId={meeting.id}
                                hasSummary={!!meeting.summary}
                                onGenerate={generateSummary}
                                isGenerating={generateSummary.isPending}
                              />
                              {meeting.meetingLink && (
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleJoinMeeting(meeting.meetingLink)}
                                  data-testid={`button-join-${meeting.id}`}
                                >
                                  <Video className="w-4 h-4 mr-2" />
                                  Join Meeting
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardFooter>
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
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditMeeting(meeting)}
                                  data-testid={`button-edit-${meeting.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteMeeting.mutate(meeting.id)}
                                  data-testid={`button-delete-${meeting.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
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
                            {meeting.participants && meeting.participants.length > 0 && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span data-testid={`text-participants-${meeting.id}`}>
                                  {meeting.participants.map(p => p.name).join(', ')}
                                </span>
                              </div>
                            )}
                            {meeting.recurrencePattern && meeting.recurrencePattern !== 'none' && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Repeat className="w-4 h-4" />
                                <span data-testid={`text-recurrence-${meeting.id}`}>
                                  Repeats {meeting.recurrencePattern}
                                  {meeting.recurrenceFrequency && meeting.recurrenceFrequency > 1 
                                    ? ` (every ${meeting.recurrenceFrequency} ${meeting.recurrencePattern === 'daily' ? 'days' : meeting.recurrencePattern === 'weekly' ? 'weeks' : 'months'})`
                                    : ''
                                  }
                                  {meeting.recurrenceEndDate && ` until ${format(new Date(meeting.recurrenceEndDate), 'PP')}`}
                                </span>
                              </div>
                            )}
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

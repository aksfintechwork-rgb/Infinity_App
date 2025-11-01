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
import { Calendar as CalendarIcon, Plus, Trash2, Video, Clock, User, Users, Repeat, Sparkles, Copy, Languages, Pencil, Zap, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns';

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
          className="w-full"
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
  onOpenMobileMenu?: () => void;
}

export default function Calendar({ currentUser, onOpenMobileMenu }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
  const { toast} = useToast();

  useEffect(() => {
    if (isCreateOpen && !selectedDate) {
      // Only clear fields if we're not opening from a day click
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setMeetingLink('');
      setSelectedParticipants([]);
      setRecurrencePattern('none');
      setRecurrenceFrequency(1);
      setRecurrenceEndDate('');
    } else if (!isCreateOpen) {
      // Clear selectedDate when dialog closes
      setSelectedDate(null);
    }
  }, [isCreateOpen, selectedDate]);

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
      toast({
        title: 'Meeting created',
        description: 'Your meeting has been scheduled successfully.',
      });
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
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

  // Helper function to add branding-hiding config to video call URL
  const addVideoConfig = (url: string) => {
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
      setActiveVideoMeeting(addVideoConfig(link));
    } else {
      // Generate a random room
      const roomName = `supremo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const videoLink = `https://meet.jit.si/${roomName}`;
      setActiveVideoMeeting(addVideoConfig(videoLink));
    }
  };

  const handleGenerateMeetingLink = () => {
    const roomName = `supremo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const baseLink = `https://meet.jit.si/${roomName}`;
    setMeetingLink(addVideoConfig(baseLink));
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
      const videoLink = `https://meet.jit.si/${roomName}`;
      handleJoinMeeting(videoLink);
    }
  };

  // Calendar navigation functions
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleTodayClick = () => {
    setCurrentMonth(new Date());
  };

  // Generate calendar days for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get meetings for a specific day
  const getMeetingsForDay = (day: Date) => {
    return meetings.filter(meeting => 
      isSameDay(parseISO(meeting.startTime), day)
    );
  };

  // Handle clicking on a day in the calendar
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    // Pre-fill the meeting start time with the selected day at 9 AM
    const defaultStartTime = new Date(day);
    defaultStartTime.setHours(9, 0, 0, 0);
    const defaultEndTime = new Date(day);
    defaultEndTime.setHours(10, 0, 0, 0);
    
    setStartTime(format(defaultStartTime, "yyyy-MM-dd'T'HH:mm"));
    setEndTime(format(defaultEndTime, "yyyy-MM-dd'T'HH:mm"));
    setIsCreateOpen(true);
  };

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
          {onOpenMobileMenu && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMobileMenu}
              data-testid="button-mobile-menu-calendar"
              className="md:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
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
                    Generate a link or enter your own video conference URL
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
                  <Label htmlFor="edit-meetingLink">Video Meeting Link</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-meetingLink"
                      placeholder="https://your-video-conference-url"
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

      <div className="flex-1 flex flex-col p-4">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTodayClick}
              data-testid="button-today"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {calendarDays.map((day, index) => {
              const dayMeetings = getMeetingsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`
                    min-h-[100px] p-2 rounded-lg border transition-colors
                    ${isCurrentDay ? 'bg-primary/10 border-primary' : 'border-border'}
                    ${!isCurrentMonth ? 'opacity-40' : 'opacity-100'}
                    ${isCurrentMonth ? 'hover:bg-accent' : ''}
                    flex flex-col items-start
                  `}
                  data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isCurrentDay ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>
                  <div className="w-full space-y-1">
                    {dayMeetings.slice(0, 3).map(meeting => (
                      <div
                        key={meeting.id}
                        className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary truncate w-full"
                        title={meeting.title}
                        data-testid={`meeting-indicator-${meeting.id}`}
                      >
                        {format(parseISO(meeting.startTime), 'HH:mm')} {meeting.title}
                      </div>
                    ))}
                    {dayMeetings.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1.5">
                        +{dayMeetings.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

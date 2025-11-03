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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Calendar as CalendarIcon, Plus, Trash2, Video, Clock, User, Users, Repeat, Sparkles, Copy, Languages, Pencil, Zap, Menu, ChevronLeft, ChevronRight, MoreVertical, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, addDays, addWeeks, addMonths as addMonthsToDate, isBefore, isAfter } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

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

    // Check if meeting is scheduled on Sunday (weekly off)
    const meetingDate = new Date(startTime);
    if (meetingDate.getDay() === 0) {
      toast({
        title: 'Weekly Off',
        description: 'Meetings cannot be scheduled on Sundays. Please select a working day (Monday-Saturday).',
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

    // Convert IST times to UTC for storage
    const startTimeUTC = fromZonedTime(startTime, IST_TIMEZONE).toISOString();
    const endTimeUTC = fromZonedTime(endTime, IST_TIMEZONE).toISOString();

    createMeeting.mutate({
      title,
      description,
      startTime: startTimeUTC,
      endTime: endTimeUTC,
      meetingLink: meetingLink || undefined,
      participantIds: selectedParticipants.length > 0 ? selectedParticipants : undefined,
      recurrencePattern: recurrencePattern || 'none',
      recurrenceFrequency: recurrencePattern !== 'none' ? recurrenceFrequency : undefined,
      recurrenceEndDate: recurrencePattern !== 'none' ? recurrenceEndDate : undefined,
    });
  };

  const handleJoinMeeting = (link?: string) => {
    let videoUrl: string;
    if (link) {
      videoUrl = link;
    } else {
      // Generate a random room for Daily.co
      const roomName = `supremo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      videoUrl = `https://supremotraders.daily.co/${roomName}`;
    }
    
    // Open in new window - Daily.co instant join with NO lobby!
    const newWindow = window.open(videoUrl, '_blank', 'width=1200,height=800,resizable=yes,scrollbars=yes');
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      toast({
        title: 'Popup blocked',
        description: 'Please allow popups for this site to join video meetings in a new window.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateMeetingLink = () => {
    const roomName = `supremo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setMeetingLink(`https://supremotraders.daily.co/${roomName}`);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setTitle(meeting.title);
    setDescription(meeting.description || '');
    
    // Convert UTC times to IST for display in form
    const startTimeIST = toZonedTime(parseISO(meeting.startTime), IST_TIMEZONE);
    const endTimeIST = toZonedTime(parseISO(meeting.endTime), IST_TIMEZONE);
    setStartTime(format(startTimeIST, "yyyy-MM-dd'T'HH:mm"));
    setEndTime(format(endTimeIST, "yyyy-MM-dd'T'HH:mm"));
    
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

    // Check if meeting is scheduled on Sunday (weekly off)
    const meetingDate = new Date(startTime);
    if (meetingDate.getDay() === 0) {
      toast({
        title: 'Weekly Off',
        description: 'Meetings cannot be scheduled on Sundays. Please select a working day (Monday-Saturday).',
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

    // Convert IST times to UTC for storage
    const startTimeUTC = fromZonedTime(startTime, IST_TIMEZONE).toISOString();
    const endTimeUTC = fromZonedTime(endTime, IST_TIMEZONE).toISOString();

    updateMeeting.mutate({
      id: editingMeetingId,
      title,
      description,
      startTime: startTimeUTC,
      endTime: endTimeUTC,
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
      const videoLink = `https://supremotraders.daily.co/${roomName}`;
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

  // Generate recurring meeting instances
  const generateRecurringInstances = (meeting: Meeting) => {
    const instances: Array<Meeting & { isRecurringInstance?: boolean; originalMeetingId?: number }> = [];
    
    // Check if original meeting is on Sunday - skip it if it is (weekly off)
    const originalMeetingDate = toZonedTime(parseISO(meeting.startTime), IST_TIMEZONE);
    const isOriginalMeetingSunday = originalMeetingDate.getDay() === 0;
    
    // Only include the original meeting if it's not on Sunday
    if (!isOriginalMeetingSunday) {
      instances.push(meeting);
    }
    
    // If no recurrence, return just the original
    if (!meeting.recurrencePattern || meeting.recurrencePattern === 'none' || !meeting.recurrenceEndDate) {
      return instances;
    }
    
    const startDate = toZonedTime(parseISO(meeting.startTime), IST_TIMEZONE);
    const endDate = toZonedTime(parseISO(meeting.recurrenceEndDate), IST_TIMEZONE);
    const frequency = meeting.recurrenceFrequency || 1;
    
    let currentDate = startDate;
    
    // Generate recurring instances
    while (true) {
      // Calculate next occurrence based on pattern
      if (meeting.recurrencePattern === 'daily') {
        currentDate = addDays(currentDate, frequency);
      } else if (meeting.recurrencePattern === 'weekly') {
        currentDate = addWeeks(currentDate, frequency);
      } else if (meeting.recurrencePattern === 'monthly') {
        currentDate = addMonthsToDate(currentDate, frequency);
      }
      
      // Stop if we've passed the end date
      if (isAfter(currentDate, endDate)) {
        break;
      }
      
      // Skip Sundays (weekly off) - don't create recurring instances on Sundays
      if (currentDate.getDay() === 0) {
        // Safety check to prevent infinite loops
        if (instances.length > 1000) {
          break;
        }
        continue;
      }
      
      // Calculate the duration of the original meeting
      const originalStart = toZonedTime(parseISO(meeting.startTime), IST_TIMEZONE);
      const originalEnd = toZonedTime(parseISO(meeting.endTime), IST_TIMEZONE);
      const duration = originalEnd.getTime() - originalStart.getTime();
      
      // Create instance with same time of day
      const instanceStart = currentDate;
      const instanceEnd = new Date(instanceStart.getTime() + duration);
      
      // Create a recurring instance
      instances.push({
        ...meeting,
        startTime: fromZonedTime(instanceStart, IST_TIMEZONE).toISOString(),
        endTime: fromZonedTime(instanceEnd, IST_TIMEZONE).toISOString(),
        isRecurringInstance: true,
        originalMeetingId: meeting.id,
      });
      
      // Safety check to prevent infinite loops
      if (instances.length > 1000) {
        break;
      }
    }
    
    return instances;
  };

  // Expand all meetings to include recurring instances
  const expandedMeetings = meetings.flatMap(meeting => generateRecurringInstances(meeting));

  // Get meetings for a specific day
  const getMeetingsForDay = (day: Date) => {
    // Don't show meetings on Sundays (weekly off)
    if (day.getDay() === 0) {
      return [];
    }
    return expandedMeetings.filter(meeting => {
      const meetingDateInIST = toZonedTime(parseISO(meeting.startTime), IST_TIMEZONE);
      return isSameDay(meetingDateInIST, day);
    });
  };

  // Handle clicking on a day in the calendar
  const handleDayClick = (day: Date) => {
    // Prevent scheduling meetings on Sundays (weekly off)
    if (day.getDay() === 0) {
      toast({
        title: 'Weekly Off',
        description: 'Meetings cannot be scheduled on Sundays. Please select a working day (Monday-Saturday).',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedDate(day);
    // Pre-fill the meeting start time with the selected day at 9 AM IST
    const defaultStartTime = new Date(day);
    defaultStartTime.setHours(9, 0, 0, 0);
    const defaultEndTime = new Date(day);
    defaultEndTime.setHours(10, 0, 0, 0);
    
    // Format times for datetime-local input (which uses local browser time)
    setStartTime(format(defaultStartTime, "yyyy-MM-dd'T'HH:mm"));
    setEndTime(format(defaultEndTime, "yyyy-MM-dd'T'HH:mm"));
    setIsCreateOpen(true);
  };

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
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="default"
            onClick={() => handleJoinMeeting()}
            data-testid="button-start-meeting-now"
          >
            <Video className="w-4 h-4 mr-2" />
            Start Meeting Now
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" data-testid="button-create-meeting">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
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
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time (IST) *</Label>
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
                      <Label htmlFor="endTime">End Time (IST) *</Label>
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
                  <p className="text-xs text-muted-foreground">All times are in Indian Standard Time (IST)</p>
                </div>
                {/* Meeting link is auto-generated when joining - hidden from UI for cleaner experience */}
                
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
        </div>

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
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-startTime">Start Time (IST) *</Label>
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
                      <Label htmlFor="edit-endTime">End Time (IST) *</Label>
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
                  <p className="text-xs text-muted-foreground">All times are in Indian Standard Time (IST)</p>
                </div>
                {/* Meeting link is auto-generated when joining - hidden from UI for cleaner experience */}
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
        <div className="flex items-center justify-between mb-6 pb-5 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold">
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
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div 
                key={day} 
                className={`text-center text-base font-bold py-3 ${
                  day === 'Sun' 
                    ? 'text-destructive' 
                    : 'text-foreground'
                }`}
              >
                {day}
                {day === 'Sun' && (
                  <div className="text-xs font-normal text-muted-foreground">Weekly Off</div>
                )}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-2 flex-1">
            {calendarDays.map((day, index) => {
              const dayMeetings = getMeetingsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              const isSunday = day.getDay() === 0;

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`
                    min-h-[120px] p-3 rounded-lg border-2 transition-colors
                    ${isCurrentDay ? 'bg-primary/10 border-primary' : isSunday ? 'bg-destructive/5 border-destructive/30' : 'border-border'}
                    ${!isCurrentMonth ? 'opacity-40' : 'opacity-100'}
                    ${isCurrentMonth && !isSunday ? 'hover:bg-accent' : ''}
                    ${isCurrentMonth && isSunday ? 'hover:bg-destructive/10' : ''}
                    flex flex-col items-start
                  `}
                  data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className={`
                      text-lg font-bold
                      ${isCurrentDay ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center' : 'text-foreground'}
                    `}>
                      {format(day, 'd')}
                    </div>
                    {isSunday && isCurrentMonth && (
                      <span className="text-xs text-destructive font-medium">OFF</span>
                    )}
                  </div>
                  <div className="w-full space-y-1.5">
                    {dayMeetings.map(meeting => (
                      <DropdownMenu key={meeting.id}>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button
                            className="text-sm font-medium px-2 py-1.5 rounded bg-primary/20 text-primary truncate w-full text-left hover:bg-primary/30 transition-colors flex items-center justify-between group"
                            title={meeting.title}
                            data-testid={`meeting-indicator-${meeting.id}`}
                          >
                            <span className="truncate">
                              {formatInTimeZone(parseISO(meeting.startTime), IST_TIMEZONE, 'h:mm a')} {meeting.title}
                            </span>
                            <MoreVertical className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem 
                            onSelect={(e) => { e.preventDefault(); handleQuickStartMeeting(meeting); }}
                            data-testid="menu-item-join-meeting"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Join Meeting
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onSelect={(e) => { e.preventDefault(); handleEditMeeting(meeting); }}
                            data-testid="menu-item-edit-meeting"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onSelect={(e) => { e.preventDefault(); deleteMeeting.mutate(meeting.id); }}
                            className="text-destructive"
                            data-testid="menu-item-delete-meeting"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ))}
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

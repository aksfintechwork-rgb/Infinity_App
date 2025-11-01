import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, Clock } from 'lucide-react';
import { Meeting } from '@shared/schema';
import { isToday, isTomorrow, addHours } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { useToast } from '@/hooks/use-toast';

const IST_TIMEZONE = 'Asia/Kolkata';

interface MeetingWithParticipants extends Meeting {
  participants: number[];
  participantNames: string[];
}

export function UpcomingMeetings() {
  const { toast } = useToast();

  const { data: meetings = [] } = useQuery<MeetingWithParticipants[]>({
    queryKey: ['/api/meetings/my-meetings'],
  });

  // Filter for upcoming meetings (today and within next 24 hours)
  const now = new Date();
  const next24Hours = addHours(now, 24);

  const upcomingMeetings = meetings
    .filter((meeting) => {
      const meetingStart = new Date(meeting.startTime);
      return meetingStart >= now && meetingStart <= next24Hours;
    })
    .sort((a, b) => {
      const aTime = new Date(a.startTime).getTime();
      const bTime = new Date(b.startTime).getTime();
      return aTime - bTime;
    })
    .slice(0, 3); // Show max 3 upcoming meetings

  const handleJoinMeeting = (meeting: MeetingWithParticipants) => {
    // Auto-generate meeting link if not present
    const roomName = `supremo-meeting-${meeting.id}`;
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
    
    const meetingLink = meeting.meetingLink || `https://meet.jit.si/${roomName}#${config}`;
    
    const newWindow = window.open(meetingLink, '_blank', 'noopener,noreferrer');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      toast({
        title: 'Popup blocked',
        description: 'Please allow popups to join the meeting',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Joining meeting',
        description: `Opened "${meeting.title}" in new window`,
      });
    }
  };

  const getTimeLabel = (meeting: MeetingWithParticipants) => {
    const meetingStart = new Date(meeting.startTime);
    const meetingDate = toZonedTime(meetingStart, IST_TIMEZONE);
    const time = formatInTimeZone(meetingStart, IST_TIMEZONE, 'h:mm a');
    
    if (isToday(meetingDate)) {
      return `Today at ${time}`;
    } else if (isTomorrow(meetingDate)) {
      return `Tomorrow at ${time}`;
    } else {
      return formatInTimeZone(meetingStart, IST_TIMEZONE, 'MMM d, h:mm a');
    }
  };

  if (upcomingMeetings.length === 0) {
    return null;
  }

  return (
    <div className="p-3 border-b border-border flex-shrink-0 bg-background">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Quick Join
        </h3>
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        {upcomingMeetings.map((meeting) => (
          <Card key={meeting.id} className="p-2.5 hover-elevate border">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate mb-0.5" title={meeting.title}>
                  {meeting.title}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getTimeLabel(meeting)}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleJoinMeeting(meeting)}
                data-testid={`button-quick-join-${meeting.id}`}
                className="flex-shrink-0 h-8"
              >
                <Video className="w-3.5 h-3.5 mr-1.5" />
                Join
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Copy, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PreMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingUrl: string;
  onJoin: (videoEnabled: boolean, audioEnabled: boolean) => void;
}

export function PreMeetingDialog({ open, onOpenChange, meetingUrl, onJoin }: PreMeetingDialogProps) {
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    const savedVideo = localStorage.getItem('meeting_video_enabled');
    const savedAudio = localStorage.getItem('meeting_audio_enabled');
    
    if (savedVideo !== null) {
      setVideoEnabled(savedVideo === 'true');
    }
    if (savedAudio !== null) {
      setAudioEnabled(savedAudio === 'true');
    }
  }, []);

  const handleVideoToggle = (checked: boolean) => {
    setVideoEnabled(checked);
    localStorage.setItem('meeting_video_enabled', String(checked));
  };

  const handleAudioToggle = (checked: boolean) => {
    setAudioEnabled(checked);
    localStorage.setItem('meeting_audio_enabled', String(checked));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      toast({
        title: 'Link copied',
        description: 'Meeting link copied to clipboard',
      });
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleJoin = () => {
    onJoin(videoEnabled, audioEnabled);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-pre-meeting">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">Join Meeting</DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            Configure your audio and video settings before joining the meeting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-link">Meeting Link</Label>
            <div className="flex gap-2">
              <Input
                id="meeting-link"
                value={meetingUrl}
                readOnly
                className="flex-1 font-mono text-sm"
                data-testid="input-meeting-link"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
                data-testid="button-copy-link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-4 hover-elevate">
              <div className="flex items-center gap-3">
                {videoEnabled ? (
                  <Video className="h-5 w-5 text-primary" />
                ) : (
                  <VideoOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="space-y-0.5">
                  <Label
                    htmlFor="video-toggle"
                    className="text-base font-medium cursor-pointer"
                  >
                    Camera
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {videoEnabled ? 'Camera will be on when you join' : 'Camera will be off when you join'}
                  </p>
                </div>
              </div>
              <Switch
                id="video-toggle"
                checked={videoEnabled}
                onCheckedChange={handleVideoToggle}
                data-testid="switch-video"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-4 hover-elevate">
              <div className="flex items-center gap-3">
                {audioEnabled ? (
                  <Mic className="h-5 w-5 text-primary" />
                ) : (
                  <MicOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="space-y-0.5">
                  <Label
                    htmlFor="audio-toggle"
                    className="text-base font-medium cursor-pointer"
                  >
                    Microphone
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {audioEnabled ? 'Microphone will be on when you join' : 'Microphone will be muted when you join'}
                  </p>
                </div>
              </div>
              <Switch
                id="audio-toggle"
                checked={audioEnabled}
                onCheckedChange={handleAudioToggle}
                data-testid="switch-audio"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            data-testid="button-join-meeting"
          >
            Join Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

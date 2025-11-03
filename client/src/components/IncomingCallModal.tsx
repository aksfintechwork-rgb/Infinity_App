import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallModalProps {
  isOpen: boolean;
  callerName: string;
  callerAvatar?: string;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({
  isOpen,
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (isOpen && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      
      // Create a simple ringtone using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 480; // Hz
      gainNode.gain.value = 0.3;
      oscillator.type = 'sine';
      
      if (!isRinging) {
        oscillator.start();
        setIsRinging(true);
        
        // Auto-stop after 30 seconds
        setTimeout(() => {
          oscillator.stop();
          setIsRinging(false);
          onReject(); // Auto-reject after timeout
        }, 30000);
      }
      
      return () => {
        if (isRinging) {
          oscillator.stop();
          setIsRinging(false);
        }
      };
    }
  }, [isOpen, isRinging, onReject]);

  const initials = callerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleAccept = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsRinging(false);
    onAccept();
  };

  const handleReject = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsRinging(false);
    onReject();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleReject}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary/20 animate-pulse">
              <AvatarImage src={callerAvatar} />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center border-4 border-background shadow-lg">
              {callType === 'video' ? (
                <Video className="w-6 h-6 text-primary-foreground" />
              ) : (
                <Phone className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {callerName}
            </h2>
            <p className="text-sm text-muted-foreground">
              Incoming {callType} call...
            </p>
          </div>

          <div className="flex gap-4 w-full">
            <Button
              onClick={handleReject}
              variant="destructive"
              size="lg"
              className="flex-1 h-14 text-base gap-2"
              data-testid="button-reject-call"
            >
              <PhoneOff className="w-5 h-5" />
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              variant="default"
              size="lg"
              className="flex-1 h-14 text-base gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              data-testid="button-accept-call"
            >
              <Phone className="w-5 h-5" />
              Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

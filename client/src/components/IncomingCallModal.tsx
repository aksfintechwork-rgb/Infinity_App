import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillator1Ref = useRef<OscillatorNode | null>(null);
  const oscillator2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !hasStartedRef.current) {
      hasStartedRef.current = true;
      
      // Create soft, pleasant dual-tone ringtone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1Ref.current = oscillator1;
      oscillator2Ref.current = oscillator2;
      gainNodeRef.current = gainNode;
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Soft dual-tone ringtone (pleasant frequencies)
      oscillator1.frequency.value = 523; // C5 - gentle tone
      oscillator2.frequency.value = 659; // E5 - harmonious interval
      gainNode.gain.value = 0.3; // Soft, pleasant volume
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      
      oscillator1.start();
      oscillator2.start();
      
      // Show desktop notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Incoming ${callType} call`, {
          body: `${callerName} is calling you`,
          icon: callerAvatar,
          tag: 'incoming-call',
          requireInteraction: true,
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(`Incoming ${callType} call`, {
              body: `${callerName} is calling you`,
              icon: callerAvatar,
              tag: 'incoming-call',
              requireInteraction: true,
            });
          }
        });
      }
      
      // Show prominent toast notification
      toast({
        title: `INCOMING ${callType.toUpperCase()} CALL`,
        description: `${callerName} is calling you`,
        duration: 30000,
      });
      
      // Auto-reject after 30 seconds
      timeoutRef.current = setTimeout(() => {
        if (oscillator1) {
          try { oscillator1.stop(); } catch(e) {}
        }
        if (oscillator2) {
          try { oscillator2.stop(); } catch(e) {}
        }
        if (gainNode) {
          gainNode.disconnect();
        }
        if (audioContext) {
          audioContext.close();
        }
        hasStartedRef.current = false;
        onReject();
      }, 30000);
    }
    
    return () => {
      // Always cleanup audio on unmount/close
      if (hasStartedRef.current) {
        if (oscillator1Ref.current) {
          try { oscillator1Ref.current.stop(); } catch(e) {}
        }
        if (oscillator2Ref.current) {
          try { oscillator2Ref.current.stop(); } catch(e) {}
        }
        if (gainNodeRef.current) {
          try { gainNodeRef.current.disconnect(); } catch(e) {}
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try { audioContextRef.current.close(); } catch(e) {}
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        hasStartedRef.current = false;
      }
    };
  }, [isOpen, callerName, callerAvatar, callType, toast, onReject]);

  const initials = callerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleAccept = () => {
    // Stop the ringtone and cleanup audio resources
    if (oscillator1Ref.current) {
      try { oscillator1Ref.current.stop(); } catch(e) {}
    }
    if (oscillator2Ref.current) {
      try { oscillator2Ref.current.stop(); } catch(e) {}
    }
    if (gainNodeRef.current) {
      try { gainNodeRef.current.disconnect(); } catch(e) {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch(e) {}
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    hasStartedRef.current = false;
    onAccept();
  };

  const handleReject = () => {
    // Stop the ringtone and cleanup audio resources
    if (oscillator1Ref.current) {
      try { oscillator1Ref.current.stop(); } catch(e) {}
    }
    if (oscillator2Ref.current) {
      try { oscillator2Ref.current.stop(); } catch(e) {}
    }
    if (gainNodeRef.current) {
      try { gainNodeRef.current.disconnect(); } catch(e) {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch(e) {}
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    hasStartedRef.current = false;
    onReject();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleReject}>
      <DialogContent className="sm:max-w-md [&>button]:hidden border-2 border-primary">
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="w-full bg-primary/10 dark:bg-primary/20 rounded-md p-3 text-center">
            <p className="text-base font-semibold text-primary uppercase tracking-wide">
              INCOMING {callType} CALL
            </p>
          </div>

          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-primary/20 relative z-10">
              <AvatarImage src={callerAvatar} />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center border-4 border-background z-20">
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
              is calling you
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
              size="lg"
              className="flex-1 h-14 text-base gap-2 bg-green-600 dark:bg-green-600"
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

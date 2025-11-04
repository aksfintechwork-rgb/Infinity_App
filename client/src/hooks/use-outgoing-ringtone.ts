import { useEffect, useRef } from 'react';

export function useOutgoingRingtone(isPlaying: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (isPlaying && !hasStartedRef.current) {
      hasStartedRef.current = true;

      // Create audio context for outgoing call tone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const playTone = () => {
        // Create oscillator for single-tone beep
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Single tone at 440Hz (A note) - clear and distinctive
        oscillator.frequency.value = 440;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.8; // LOUD volume

        oscillator.start();
        
        // Play for 0.5 seconds
        setTimeout(() => {
          try {
            oscillator.stop();
            gainNode.disconnect();
          } catch (e) {
            // Ignore if already stopped
          }
        }, 500);
      };

      // Play tone immediately
      playTone();

      // Then repeat every 2 seconds
      intervalRef.current = setInterval(playTone, 2000);
    }

    return () => {
      // Always cleanup audio on unmount/close
      if (hasStartedRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (oscillatorRef.current) {
          try {
            oscillatorRef.current.stop();
          } catch (e) {
            // Ignore
          }
        }
        if (gainNodeRef.current) {
          try {
            gainNodeRef.current.disconnect();
          } catch (e) {
            // Ignore
          }
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try {
            audioContextRef.current.close();
          } catch (e) {
            // Ignore
          }
        }
        hasStartedRef.current = false;
      }
    };
  }, [isPlaying]);
}

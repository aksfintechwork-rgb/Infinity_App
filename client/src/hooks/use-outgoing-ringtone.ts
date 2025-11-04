import { useEffect, useRef } from 'react';

export function useOutgoingRingtone(isPlaying: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentOscillatorRef = useRef<OscillatorNode | null>(null);
  const currentGainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (isPlaying && !hasStartedRef.current) {
      hasStartedRef.current = true;

      // Create audio context for outgoing call tone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const playTone = () => {
        // Stop any currently playing tone first
        if (currentOscillatorRef.current) {
          try {
            currentOscillatorRef.current.stop();
          } catch (e) {
            // Ignore if already stopped
          }
        }
        if (currentGainNodeRef.current) {
          try {
            currentGainNodeRef.current.disconnect();
          } catch (e) {
            // Ignore
          }
        }

        // Create oscillator for single-tone beep
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Store in refs so cleanup can access them
        currentOscillatorRef.current = oscillator;
        currentGainNodeRef.current = gainNode;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Single tone at 440Hz (A note) - clear and distinctive
        oscillator.frequency.value = 440;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.8; // LOUD volume

        oscillator.start();
        
        // Play for 0.5 seconds then stop
        timeoutRef.current = setTimeout(() => {
          try {
            if (currentOscillatorRef.current === oscillator) {
              oscillator.stop();
              gainNode.disconnect();
              currentOscillatorRef.current = null;
              currentGainNodeRef.current = null;
            }
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
        // Clear interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        // Stop currently playing oscillator immediately
        if (currentOscillatorRef.current) {
          try {
            currentOscillatorRef.current.stop();
          } catch (e) {
            // Ignore
          }
        }
        // Disconnect gain node
        if (currentGainNodeRef.current) {
          try {
            currentGainNodeRef.current.disconnect();
          } catch (e) {
            // Ignore
          }
        }
        // Close audio context
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

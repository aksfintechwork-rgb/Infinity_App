// Single reusable AudioContext for all notifications
let audioContext: AudioContext | null = null;
let isAudioInitialized = false;

// Initialize audio context (must be called from a user gesture)
export function initializeAudio() {
  if (isAudioInitialized) return;
  
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    isAudioInitialized = true;
  } catch (error) {
    console.error('Failed to initialize audio context:', error);
  }
}

// Play notification sound using the reusable audio context
export async function playNotificationSound() {
  if (!audioContext) {
    console.warn('Audio context not initialized. Sound will not play.');
    return;
  }

  try {
    // Resume context if suspended (required for autoplay policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      
      // Check if resume was successful
      if (audioContext.state === 'suspended') {
        console.warn('Audio context could not be resumed. User interaction may be required to enable sound.');
        return;
      }
    }

    const now = audioContext.currentTime;
    
    // Play a triple-beep pattern for better noticeability
    const playBeep = (startTime: number, frequency: number, duration: number, volume: number) => {
      const oscillator = audioContext!.createOscillator();
      const gainNode = audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext!.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // Triple beep: high volume, pleasant frequencies
    playBeep(now, 880, 0.15, 0.5);           // First beep (A5)
    playBeep(now + 0.2, 1046.5, 0.15, 0.5);  // Second beep (C6)
    playBeep(now + 0.4, 1318.5, 0.2, 0.6);   // Third beep (E6) - slightly longer and louder
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Show browser notification
export function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    // Focus window when notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

// Show new message notification
export function notifyNewMessage(
  senderName: string,
  messageBody: string,
  conversationTitle?: string,
  isGroupChat: boolean = false
) {
  // Create clear, informative title showing conversation context
  let title: string;
  
  if (conversationTitle) {
    // Group chat with name
    title = `💬 ${conversationTitle}`;
  } else if (isGroupChat) {
    // Group chat without name (shouldn't happen but handle it)
    title = `💬 Group Chat`;
  } else {
    // Direct message
    title = `💬 Direct Message`;
  }
  
  // Create detailed body showing sender and message
  const messagePreview = messageBody || 'Sent an attachment';
  const body = `${senderName}: ${messagePreview}`;

  showNotification(title, {
    body,
    tag: 'new-message', // Replaces previous notification
    requireInteraction: false,
  });

  playNotificationSound();
}

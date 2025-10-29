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

    // Create a new oscillator for each beep (oscillators are single-use)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // 800 Hz tone
    oscillator.type = 'sine';
    
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
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
  conversationTitle?: string
) {
  const title = conversationTitle
    ? `${senderName} in ${conversationTitle}`
    : senderName;
  
  const body = messageBody || 'Sent an attachment';

  showNotification(title, {
    body,
    tag: 'new-message', // Replaces previous notification
  });

  playNotificationSound();
}

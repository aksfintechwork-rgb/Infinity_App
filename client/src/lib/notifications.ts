// Notification sound using Web Audio API
let notificationSound: HTMLAudioElement | null = null;

// Initialize notification sound
function initSound() {
  if (notificationSound) return;
  
  // Create a simple notification beep using data URL
  // This is a short, pleasant notification sound
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Create a simple beep sound
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800; // Frequency in Hz
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  // Store for reuse
  notificationSound = new Audio();
}

// Play notification sound
export function playNotificationSound() {
  try {
    // Create a simple beep using Web Audio API each time
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
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

// Initialize on load
initSound();

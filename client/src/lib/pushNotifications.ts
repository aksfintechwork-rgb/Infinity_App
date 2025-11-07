import { apiRequest } from './queryClient';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export async function registerPushNotifications(userId: number): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push notification permission denied');
      return false;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Store userId and auth token in cache for service worker access
    const cache = await caches.open('auth-cache');
    const token = localStorage.getItem('auth_token');
    if (token) {
      await cache.put('/_authToken', new Response(token));
      await cache.put('/_userId', new Response(userId.toString()));
    }

    // Strip any surrounding quotes from the VAPID key
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.replace(/^"|"$/g, '');
    if (!vapidPublicKey) {
      console.error('VAPID public key not found');
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const subscriptionJSON = subscription.toJSON();
    
    await apiRequest('/api/push-subscription', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        endpoint: subscriptionJSON.endpoint,
        p256dhKey: subscriptionJSON.keys?.p256dh,
        authKey: subscriptionJSON.keys?.auth,
      }),
    });

    console.log('Push notification registered successfully');
    return true;
  } catch (error) {
    console.error('Error registering push notifications:', error);
    return false;
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const subscriptionJSON = subscription.toJSON();
      await subscription.unsubscribe();
      
      await apiRequest('/api/push-subscription', {
        method: 'DELETE',
        body: JSON.stringify({
          endpoint: subscriptionJSON.endpoint,
        }),
      });
    }
    
    // Clean up cached auth data
    const cache = await caches.open('auth-cache');
    await cache.delete('/_authToken');
    await cache.delete('/_userId');
  } catch (error) {
    console.error('Error unregistering push notifications:', error);
  }
}

export async function checkPushNotificationStatus(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const permission = Notification.permission;
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Error checking push notification status:', error);
    return false;
  }
}

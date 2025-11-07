self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Incoming Call';
  const options = {
    body: data.body || 'You have an incoming call',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'incoming-call',
    requireInteraction: true,
    actions: [
      { action: 'answer', title: 'Answer' },
      { action: 'decline', title: 'Decline' }
    ],
    data: {
      url: data.url || '/',
      callData: data.callData || {}
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'answer') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'decline') {
    event.waitUntil(
      fetch('/api/calls/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.notification.data.callData)
      })
    );
  } else {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

self.addEventListener('pushsubscriptionchange', async (event) => {
  event.waitUntil(
    (async () => {
      try {
        const newSubscription = await self.registration.pushManager.subscribe(
          event.oldSubscription.options
        );
        
        const subscriptionJSON = newSubscription.toJSON();
        
        const userId = await caches.match('/_userId').then(r => r ? r.text() : null);
        const token = await caches.match('/_authToken').then(r => r ? r.text() : null);
        
        if (!userId || !token) {
          console.error('Cannot re-subscribe: missing userId or auth token');
          return;
        }
        
        await fetch('/api/push-subscription', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: parseInt(userId),
            endpoint: subscriptionJSON.endpoint,
            p256dhKey: subscriptionJSON.keys?.p256dh,
            authKey: subscriptionJSON.keys?.auth,
          })
        });
        
        console.log('Push subscription renewed successfully');
      } catch (error) {
        console.error('Failed to renew push subscription:', error);
      }
    })()
  );
});

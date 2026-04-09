self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title ?? 'nearly. digest is ready';
  const options = {
    body: data.body ?? 'Your daily digest is here. Tap to read.',
    icon: '/nearly-icon.svg',
    badge: '/nearly-icon.svg',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo-192x192.png',
    badge: '/logo-192x192.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Lógica para abrir uma URL ao clicar na notificação
  // event.waitUntil(
  //   clients.openWindow('https://example.com')
  // );
});

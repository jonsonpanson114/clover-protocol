// Service Worker for CLOVER PROTOCOL PWA
// Handles push notifications and caching

const CACHE_NAME = 'clover-v1';
const STATIC_CACHE = 'static-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/pwa-192x192.png',
        '/pwa-512x512.png',
        '/pwa-maskable-512.png',
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // If not JSON, use text
    data = {
      title: 'CLOVER PROTOCOL',
      body: event.data ? event.data.text() : '新しい通知があります',
    };
  }

  const options = {
    body: data.body || 'ミッションが利用可能です',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'clover-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'アプリを開く',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CLOVER PROTOCOL', options)
  );
});

// Notification click event - open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's an open window, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Periodic sync for checking reminders
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkReminders());
  }
});

// Check reminders function
async function checkReminders() {
  // This would typically communicate with the main app
  // For now, it's a placeholder for future implementation
  console.log('[SW] Checking reminders...');
}

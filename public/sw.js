// Service Worker for CLOVER PROTOCOL PWA
// Handles push notifications and caching

const STATIC_CACHE = 'static-v1';
const DB_NAME = 'CloverReminderDB';
const DB_VERSION = 1;
const STORE_NAME = 'reminders';

let checkInterval = null;

// IndexedDB helpers
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const getAllReminders = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const updateReminder = async (reminder) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(reminder);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteReminder = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Check and send notifications
const checkReminders = async () => {
  try {
    const reminders = await getAllReminders();
    const now = Date.now();

    for (const reminder of reminders) {
      // Skip if already notified
      if (reminder.notified) continue;

      // Check if time has come
      if (reminder.targetTime <= now) {
        // Show notification
        await self.registration.showNotification(
          reminder.title || 'CLOVER PROTOCOL',
          {
            body: reminder.body || 'ミッションの時間です',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: reminder.id,
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: { reminderId: reminder.id }
          }
        );

        // Mark as notified
        await updateReminder({ ...reminder, notified: true });

        console.log('[SW] Reminder sent:', reminder.id);
      }
    }

    // Clean up old reminders (older than 1 hour and already notified)
    const oneHourAgo = now - (60 * 60 * 1000);
    for (const reminder of reminders) {
      if (reminder.notified && reminder.targetTime < oneHourAgo) {
        await deleteReminder(reminder.id);
        console.log('[SW] Cleaned up old reminder:', reminder.id);
      }
    }
  } catch (error) {
    console.error('[SW] Error checking reminders:', error);
  }
};

// Install event
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

// Activate event
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

  // Start checking reminders immediately
  event.waitUntil(
    (async () => {
      await checkReminders();
      // Check every 30 seconds
      if (!checkInterval) {
        checkInterval = setInterval(checkReminders, 30000);
        console.log('[SW] Started reminder checker (30s interval)');
      }
    })()
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push event
self.addEventListener('push', (event) => {
  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
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

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkReminders());
  }
});

// Message event - receive commands from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_REMINDERS') {
    event.waitUntil(checkReminders());
  }
});

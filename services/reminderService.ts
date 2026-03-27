// Reminder service for background notifications using IndexedDB

const DB_NAME = 'CloverReminderDB';
const DB_VERSION = 1;
const STORE_NAME = 'reminders';

export interface Reminder {
  id: string;
  targetTime: number;
  title: string;
  body: string;
  notified: boolean;
  characterId?: string;
  missionId?: string;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('targetTime', 'targetTime', { unique: false });
      }
    };
  });
};

export const saveReminder = async (reminder: Reminder): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(reminder);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllReminders = async (): Promise<Reminder[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteReminder = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearAllReminders = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const scheduleMissionReminder = async (
  missionId: string,
  title: string,
  targetTime: number
): Promise<void> => {
  const reminder: Reminder = {
    id: `mission-${missionId}-${Date.now()}`,
    targetTime,
    title: 'CLOVER PROTOCOL',
    body: `指令の時間だぜ: ${title}`,
    notified: false,
    missionId,
  };
  await saveReminder(reminder);
};

export const scheduleCharacterReminder = async (
  characterId: string,
  targetTime: number
): Promise<void> => {
  const reminder: Reminder = {
    id: `character-${characterId}-${Date.now()}`,
    targetTime,
    title: 'ミッション待機中',
    body: `${characterId.toUpperCase()}からの連絡が届いています。`,
    notified: false,
    characterId,
  };
  await saveReminder(reminder);
};

// Trigger Service Worker to check reminders immediately
export const triggerReminderCheck = (): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CHECK_REMINDERS'
    });
  }
};

import { CharacterId } from '../types';

const STORAGE_KEY_REMINDER = 'CLOVER_REMINDER_';
const STORAGE_KEY_PERMISSION = 'CLOVER_NOTIFICATION_PERMISSION';

/**
 * 通知権限をリクエスト
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Notification API is not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    localStorage.setItem(STORAGE_KEY_PERMISSION, permission);
    return permission === 'granted';
  }

  return false;
};

/**
 * 現在の通知権限状態を取得
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
};

/**
 * 通知を表示
 */
export const showNotification = (
  title: string,
  body: string,
  icon?: string,
  tag?: string
): void => {
  if (Notification.permission !== 'granted') {
    return;
  }

  const options: NotificationOptions = {
    body,
    icon: icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: tag || 'clover-notification',
    requireInteraction: false,
  };

  // Service Workerが登録されていればそこから通知
  if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      registration?.showNotification(title, options);
    });
  } else {
    // フォールバック: 直接Notification APIを使用
    new Notification(title, options);
  }
};

/**
 * キャラクター待機リマインダーをスケジュール
 * @param characterId キャラクターID
 * @param hours 何時間後にリマインダー（デフォルト6時間）
 */
export const scheduleReminder = (
  characterId: CharacterId,
  hours: number = 6
): void => {
  const now = Date.now();
  const remindAt = now + (hours * 60 * 60 * 1000);

  localStorage.setItem(
    `${STORAGE_KEY_REMINDER}${characterId}`,
    JSON.stringify({
      characterId,
      remindAt,
      notified: false,
    })
  );
};

/**
 * スケジュールされたリマインダーをチェックして送信
 */
export const checkScheduledReminders = (): void => {
  const now = Date.now();

  // 全キャラクター分のリマインダーをチェック
  Object.values(CharacterId).forEach(charId => {
    const key = `${STORAGE_KEY_REMINDER}${charId}`;
    const data = localStorage.getItem(key);

    if (!data) return;

    try {
      const reminder = JSON.parse(data);

      // まだ通知済みでなく、時間が経過している場合
      if (!reminder.notified && reminder.remindAt <= now) {
        showNotification(
          'ミッション待機中',
          `${charId.toUpperCase()}からの連絡が届いています。`,
          '/pwa-192x192.png',
          `reminder-${charId}`
        );

        // 通知済みフラグを更新
        localStorage.setItem(key, JSON.stringify({ ...reminder, notified: true }));
      }
    } catch (e) {
      console.error('Failed to parse reminder data', e);
    }
  });
};

/**
 * 日終わりのリマインダーをスケジュール
 * @param remainingMissions 残りミッション数
 */
export const scheduleEndOfDayReminder = (remainingMissions: number): void => {
  if (remainingMissions <= 0) return;

  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 30, 0, 0); // 23:30に通知

  if (now >= endOfDay) return;

  localStorage.setItem(
    'CLOVER_END_OF_DAY_REMINDER',
    JSON.stringify({
      remainingMissions,
      scheduledFor: endOfDay.getTime(),
      notified: false,
    })
  );
};

/**
 * 日終わりリマインダーをチェック
 */
export const checkEndOfDayReminder = (): void => {
  const now = Date.now();
  const data = localStorage.getItem('CLOVER_END_OF_DAY_REMINDER');

  if (!data) return;

  try {
    const reminder = JSON.parse(data);

    if (!reminder.notified && reminder.scheduledFor <= now) {
      showNotification(
        'ミッション締切間近！',
        `本日の残りミッション: ${reminder.remainingMissions}件`,
        '/pwa-192x192.png',
        'end-of-day'
      );

      localStorage.setItem('CLOVER_END_OF_DAY_REMINDER', JSON.stringify({ ...reminder, notified: true }));
    }
  } catch (e) {
    console.error('Failed to parse end of day reminder', e);
  }
};

/**
 * 期限切れのリマインダーを全てクリア
 */
export const clearAllReminders = (): void => {
  Object.values(CharacterId).forEach(charId => {
    localStorage.removeItem(`${STORAGE_KEY_REMINDER}${charId}`);
  });
  localStorage.removeItem('CLOVER_END_OF_DAY_REMINDER');
};

/**
 * 特定キャラクターのリマインダー状態を取得
 */
export const getReminderStatus = (characterId: CharacterId): { remindAt: number; notified: boolean } | null => {
  const data = localStorage.getItem(`${STORAGE_KEY_REMINDER}${characterId}`);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * リマインダー通知を手動でトリガー（テスト用）
 */
export const triggerReminderNow = (characterId: CharacterId): void => {
  showNotification(
    'テスト通知',
    `${characterId.toUpperCase()}からの連絡が届いています。`,
    '/pwa-192x192.png',
    `test-${characterId}`
  );
};

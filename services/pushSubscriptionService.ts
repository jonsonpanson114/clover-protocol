// Service for managing Web Push API subscriptions

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const SUBSCRIPTION_STORAGE_KEY = 'CLOVER_PUSH_SUBSCRIPTION';

/**
 * Convert URL-safe base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) {
    console.error('[Push] Service Worker not supported');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VAPID_PUBLIC_KEY not configured');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscribeOptions: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);

    // Store subscription locally
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));

    // Send subscription to server
    await sendSubscriptionToServer(subscription);

    console.log('[Push] Successfully subscribed');
    return subscription;
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    return null;
  }
}

/**
 * Get existing push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('[Push] Getting subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
      console.log('[Push] Unsubscribed successfully');
    }
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
  }
}

/**
 * Send subscription to server
 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const subscriptionData = subscription.toJSON();

  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscriptionData })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    console.log('[Push] Subscription sent to server');
  } catch (error) {
    console.error('[Push] Failed to send subscription to server:', error);
    throw error;
  }
}

/**
 * Check if push is supported and subscribed
 */
export async function isPushSubscribed(): Promise<boolean> {
  const subscription = await getPushSubscription();
  return subscription !== null;
}

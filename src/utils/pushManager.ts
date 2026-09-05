// src/utils/pushManager.ts
// Utility for managing Web Push API subscriptions and OS-level push notifications

export const VAPID_PUBLIC_KEY =
  'BAWBNIsZ2WbXzOVVIaAKbq1Gg-gMM9dHZxgeAcHUxi2GRr6LQIv603aKpPqplfu7KIy6N0kO1YkoBfi1iSJZc6Q';

/**
 * Converts a base64 URL safe string to a Uint8Array for Web Push applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if the current browser environment supports Service Worker and Push Notifications
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Returns current browser notification permission
 */
export function getPushPermissionState(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Gets the active PushSubscription from the service worker, if any
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('[pushManager] Failed to get existing push subscription:', err);
    return null;
  }
}

/**
 * Registers the service worker if needed, requests notification permission,
 * creates a Web Push subscription using VAPID, and persists it to Convex.
 */
export async function subscribeUserToPush(
  userId: string,
  saveMutation: (args: any) => Promise<any>
): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  if (!isPushSupported()) {
    return {
      success: false,
      error: 'Push notifications are not supported in this browser.',
    };
  }

  try {
    // 1. Request permission from user
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error:
          permission === 'denied'
            ? 'Notifications were blocked in your browser settings.'
            : 'Notification permission was not granted.',
      };
    }

    // 2. Ensure service worker is registered & ready
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.ready;
    } catch {
      registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
    }

    // 3. Check for existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    // 4. Extract subscription credentials
    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint;
    const p256dh = subJson.keys?.p256dh;
    const auth = subJson.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return {
        success: false,
        error: 'Failed to extract cryptographic keys from push subscription.',
      };
    }

    // Determine platform
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const platform = isMobile ? 'mobile-web' : 'desktop-web';

    // 5. Persist to Convex
    const savePayload: Record<string, any> = {
      endpoint,
      p256dh,
      auth,
      platform,
      userAgent: navigator.userAgent,
    };
    if (userId && typeof userId === 'string' && userId.trim().length > 10) {
      savePayload.userId = userId.trim();
    }
    await saveMutation(savePayload);

    return {
      success: true,
      subscription,
    };
  } catch (err: any) {
    console.error('[pushManager] subscribe error:', err);
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred while enabling push notifications.',
    };
  }
}

/**
 * Unsubscribes from browser push notifications and removes the record from Convex
 */
export async function unsubscribeUserFromPush(
  userId?: string,
  clearMutation?: (args: any) => Promise<any>
): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) return { success: true };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    let endpoint: string | undefined;
    if (subscription) {
      endpoint = subscription.endpoint;
      await subscription.unsubscribe();
    }

    if (clearMutation) {
      const clearPayload: Record<string, any> = {};
      if (endpoint) clearPayload.endpoint = endpoint;
      if (userId && typeof userId === 'string' && userId.trim().length > 10) {
        clearPayload.userId = userId.trim();
      }
      if (clearPayload.endpoint || clearPayload.userId) {
        await clearMutation(clearPayload).catch((err: any) =>
          console.warn('[pushManager] clearMutation warning:', err)
        );
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[pushManager] unsubscribe error:', err);
    return { success: false, error: err?.message || 'Failed to unsubscribe from push.' };
  }
}

/**
 * Checks if permission is already granted and syncs the subscription silently in the background
 */
export async function syncPushSubscriptionSilently(
  userId: string,
  saveMutation: (args: any) => Promise<any>
): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    const subJson = subscription.toJSON();
    if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const syncPayload: Record<string, any> = {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        platform: isMobile ? 'mobile-web' : 'desktop-web',
        userAgent: navigator.userAgent,
      };
      if (userId && typeof userId === 'string' && userId.trim().length > 10) {
        syncPayload.userId = userId.trim();
      }
      await saveMutation(syncPayload);
    }
  } catch (err) {
    // Silent sync shouldn't throw to user UI
    console.debug('[pushManager] silent sync skipped:', err);
  }
}

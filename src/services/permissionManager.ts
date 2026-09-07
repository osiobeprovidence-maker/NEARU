import { Capacitor, registerPlugin } from '@capacitor/core';

export type AppPermissionType = 'location' | 'camera' | 'microphone' | 'notifications' | 'contacts';
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'permanently_denied';

export interface PermissionCheckResult {
  name: AppPermissionType;
  status: PermissionStatus;
  isPrecise?: boolean;
  apiLevel?: number;
}

export interface PermissionRequestResult {
  name: AppPermissionType;
  status: PermissionStatus;
  isPrecise?: boolean;
  granted: boolean;
  permanentlyDenied: boolean;
}

export interface PermissionDialogConfig {
  type: AppPermissionType;
  isSettingsRecovery: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
}

export const PERMISSION_CONFIGS: Record<AppPermissionType, {
  rationale: { title: string; description: string; confirmLabel: string; cancelLabel: string };
  settings: { title: string; description: string; confirmLabel: string; cancelLabel: string };
}> = {
  location: {
    rationale: {
      title: 'Use your location',
      description: 'LALOA uses your location to show you relevant posts, people and RALLYs around you.',
      confirmLabel: 'Allow Location',
      cancelLabel: 'Not Now',
    },
    settings: {
      title: 'Permission required',
      description: 'LALOA needs location access to show nearby content. You can enable it from Android Settings.',
      confirmLabel: 'Open Settings',
      cancelLabel: 'Cancel',
    },
  },
  camera: {
    rationale: {
      title: 'Use your camera',
      description: 'Take photos and videos directly inside LALOA.',
      confirmLabel: 'Allow Camera',
      cancelLabel: 'Not Now',
    },
    settings: {
      title: 'Permission required',
      description: 'LALOA needs camera access to take photos and videos. You can enable it from Android Settings.',
      confirmLabel: 'Open Settings',
      cancelLabel: 'Cancel',
    },
  },
  microphone: {
    rationale: {
      title: 'Use your microphone',
      description: 'Record audio and sound for your LALOA videos and voice features.',
      confirmLabel: 'Allow Microphone',
      cancelLabel: 'Not Now',
    },
    settings: {
      title: 'Permission required',
      description: 'LALOA needs microphone access to record audio for voice notes and videos. You can enable it from Android Settings.',
      confirmLabel: 'Open Settings',
      cancelLabel: 'Cancel',
    },
  },
  notifications: {
    rationale: {
      title: 'Stay connected',
      description: 'Get notified when people interact with your posts, RALLYs, messages and profile.',
      confirmLabel: 'Allow Notifications',
      cancelLabel: 'Not Now',
    },
    settings: {
      title: 'Permission required',
      description: 'LALOA needs notification permission to send you real-time alerts. You can enable it from Android Settings.',
      confirmLabel: 'Open Settings',
      cancelLabel: 'Cancel',
    },
  },
  contacts: {
    rationale: {
      title: 'Find friends from contacts',
      description: 'NEARU matches your device address book to find friends already on the app. Your contacts are matched privately and never stored.',
      confirmLabel: 'Allow Contacts',
      cancelLabel: 'Not Now',
    },
    settings: {
      title: 'Contact access required',
      description: 'NEARU needs contact access to sync and match friends from your address book. You can enable it from Android Settings.',
      confirmLabel: 'Open Settings',
      cancelLabel: 'Cancel',
    },
  },
};

interface LaloaPermissionsPluginNative {
  getApiLevel(): Promise<{ apiLevel: number; release: string }>;
  checkAppPermission(options: { name: string }): Promise<PermissionCheckResult>;
  checkAllPermissions(): Promise<{
    apiLevel: number;
    location: PermissionCheckResult;
    camera: PermissionCheckResult;
    microphone: PermissionCheckResult;
    notifications: PermissionCheckResult;
    contacts: PermissionCheckResult;
  }>;
  requestAppPermission(options: { name: string }): Promise<PermissionCheckResult>;
  openAppSettings(): Promise<{ success: boolean }>;
  getDeviceContacts(): Promise<{ contacts: Array<{ name?: string; phone?: string; email?: string }> }>;
}

const NativePermissions = registerPlugin<LaloaPermissionsPluginNative>('LaloaPermissions');

class PermissionManager {
  private activeRequests = new Map<AppPermissionType, Promise<PermissionRequestResult>>();
  private cachedApiLevel: number | null = null;

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public async getApiLevel(): Promise<number> {
    if (this.cachedApiLevel !== null) {
      return this.cachedApiLevel;
    }

    if (this.isNative()) {
      try {
        const res = await NativePermissions.getApiLevel();
        this.cachedApiLevel = res.apiLevel || 33;
        return this.cachedApiLevel;
      } catch (err) {
        console.warn('[PermissionManager] getApiLevel failed:', err);
        return 33;
      }
    }
    return 0; // Web fallback
  }

  public async checkPermission(type: AppPermissionType): Promise<PermissionCheckResult> {
    if (this.isNative()) {
      try {
        const res = await NativePermissions.checkAppPermission({ name: type });
        return {
          name: type,
          status: res.status,
          isPrecise: res.isPrecise ?? false,
          apiLevel: res.apiLevel,
        };
      } catch (err) {
        console.warn(`[PermissionManager] checkAppPermission(${type}) failed:`, err);
      }
    }

    // Web Fallback
    return this.checkWebPermission(type);
  }

  public async checkAllPermissions(): Promise<Record<AppPermissionType, PermissionCheckResult>> {
    if (this.isNative()) {
      try {
        const res = await NativePermissions.checkAllPermissions();
        return {
          location: res.location,
          camera: res.camera,
          microphone: res.microphone,
          notifications: res.notifications,
          contacts: res.contacts,
        };
      } catch (err) {
        console.warn('[PermissionManager] checkAllPermissions failed:', err);
      }
    }

    const [location, camera, microphone, notifications, contacts] = await Promise.all([
      this.checkWebPermission('location'),
      this.checkWebPermission('camera'),
      this.checkWebPermission('microphone'),
      this.checkWebPermission('notifications'),
      this.checkWebPermission('contacts'),
    ]);

    return { location, camera, microphone, notifications, contacts };
  }

  public async requestDirect(type: AppPermissionType): Promise<PermissionRequestResult> {
    // Avoid concurrent duplicate requests
    const existing = this.activeRequests.get(type);
    if (existing) return existing;

    const promise = (async () => {
      try {
        if (this.isNative()) {
          const res = await NativePermissions.requestAppPermission({ name: type });
          const isGranted = res.status === 'granted';
          const isPermDenied = res.status === 'permanently_denied';

          if (isGranted) {
            localStorage.removeItem(`lalao_perm_dismissed_${type}`);
          }

          return {
            name: type,
            status: res.status,
            isPrecise: res.isPrecise ?? false,
            granted: isGranted,
            permanentlyDenied: isPermDenied,
          };
        }

        // Web Fallback
        return await this.requestWebPermission(type);
      } finally {
        this.activeRequests.delete(type);
      }
    })();

    this.activeRequests.set(type, promise);
    return promise;
  }

  public async openAppSettings(): Promise<void> {
    if (this.isNative()) {
      try {
        await NativePermissions.openAppSettings();
        return;
      } catch (err) {
        console.warn('[PermissionManager] openAppSettings failed:', err);
      }
    }
    // Web fallback notification
    window.dispatchEvent(
      new CustomEvent('show-toast', {
        detail: {
          title: 'Permission Settings',
          subtitle: 'Please update permissions from your browser address bar / site settings.',
        },
      })
    );
  }

  public async getDeviceContacts(): Promise<Array<{ name?: string; phone?: string; email?: string }>> {
    if (this.isNative()) {
      try {
        const res = await NativePermissions.getDeviceContacts();
        return res?.contacts || [];
      } catch (err) {
        console.warn('[PermissionManager] Native getDeviceContacts error:', err);
        throw err;
      }
    }

    // Web Fallback: W3C Contact Picker API if available
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel', 'email'];
        const selected = await (navigator as any).contacts.select(props, {
          multiple: true,
        });

        if (selected && selected.length > 0) {
          const parsed: Array<{ name?: string; phone?: string; email?: string }> = [];
          for (const item of selected) {
            const name = Array.isArray(item.name) ? item.name[0] : item.name;
            const phones: string[] = Array.isArray(item.tel) ? item.tel : item.tel ? [item.tel] : [];
            const emails: string[] = Array.isArray(item.email) ? item.email : item.email ? [item.email] : [];

            if (phones.length > 0) {
              for (const phone of phones) {
                parsed.push({ name, phone, email: emails[0] });
              }
            } else if (emails.length > 0) {
              for (const email of emails) {
                parsed.push({ name, email });
              }
            } else if (name) {
              parsed.push({ name });
            }
          }
          return parsed;
        }
        return [];
      } catch (err) {
        console.warn('[PermissionManager] Web contacts.select error:', err);
        throw err;
      }
    }

    throw new Error('Contact access is supported on mobile devices.');
  }

  public hasDismissedRecently(type: AppPermissionType, cooldownMs = 24 * 60 * 60 * 1000): boolean {
    const raw = localStorage.getItem(`lalao_perm_dismissed_${type}`);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (isNaN(ts)) return false;
    return Date.now() - ts < cooldownMs;
  }

  public markDismissed(type: AppPermissionType): void {
    localStorage.setItem(`lalao_perm_dismissed_${type}`, Date.now().toString());
  }

  public clearDismissed(type: AppPermissionType): void {
    localStorage.removeItem(`lalao_perm_dismissed_${type}`);
  }

  // --- Web fallbacks ---
  private async checkWebPermission(type: AppPermissionType): Promise<PermissionCheckResult> {
    try {
      if (type === 'contacts') {
        if ('contacts' in navigator && 'ContactsManager' in window) {
          return { name: type, status: 'prompt' };
        }
        return { name: type, status: 'denied' };
      }

      if (type === 'notifications') {
        if (!('Notification' in window)) {
          return { name: type, status: 'denied' };
        }
        if (Notification.permission === 'granted') return { name: type, status: 'granted' };
        if (Notification.permission === 'denied') return { name: type, status: 'permanently_denied' };
        return { name: type, status: 'prompt' };
      }

      if (type === 'location') {
        if (!navigator.geolocation) return { name: type, status: 'denied' };
        if ('permissions' in navigator) {
          try {
            const res = await navigator.permissions.query({ name: 'geolocation' as any });
            if (res.state === 'granted') return { name: type, status: 'granted', isPrecise: true };
            if (res.state === 'denied') return { name: type, status: 'permanently_denied' };
            return { name: type, status: 'prompt' };
          } catch {}
        }
        return { name: type, status: 'prompt' };
      }

      if (type === 'camera' || type === 'microphone') {
        if ('permissions' in navigator) {
          try {
            const queryName = type === 'camera' ? 'camera' : 'microphone';
            const res = await navigator.permissions.query({ name: queryName as any });
            if (res.state === 'granted') return { name: type, status: 'granted' };
            if (res.state === 'denied') return { name: type, status: 'permanently_denied' };
            return { name: type, status: 'prompt' };
          } catch {}
        }
        return { name: type, status: 'prompt' };
      }
    } catch {}

    return { name: type, status: 'prompt' };
  }

  private async requestWebPermission(type: AppPermissionType): Promise<PermissionRequestResult> {
    if (type === 'contacts') {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        return { name: type, status: 'granted', granted: true, permanentlyDenied: false };
      }
      return { name: type, status: 'denied', granted: false, permanentlyDenied: true };
    }

    if (type === 'notifications') {
      if (!('Notification' in window)) {
        return { name: type, status: 'denied', granted: false, permanentlyDenied: true };
      }
      const res = await Notification.requestPermission();
      return {
        name: type,
        status: res === 'granted' ? 'granted' : 'permanently_denied',
        granted: res === 'granted',
        permanentlyDenied: res === 'denied',
      };
    }

    if (type === 'location') {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ name: type, status: 'denied', granted: false, permanentlyDenied: true });
          return;
        }
        navigator.geolocation.getCurrentPosition(
          () => {
            resolve({ name: type, status: 'granted', granted: true, isPrecise: true, permanentlyDenied: false });
          },
          (err) => {
            const permDenied = err.code === err.PERMISSION_DENIED;
            resolve({
              name: type,
              status: permDenied ? 'permanently_denied' : 'denied',
              granted: false,
              permanentlyDenied: permDenied,
            });
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }

    if (type === 'microphone') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        return { name: type, status: 'granted', granted: true, permanentlyDenied: false };
      } catch {
        return { name: type, status: 'denied', granted: false, permanentlyDenied: true };
      }
    }

    if (type === 'camera') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        return { name: type, status: 'granted', granted: true, permanentlyDenied: false };
      } catch {
        return { name: type, status: 'denied', granted: false, permanentlyDenied: true };
      }
    }

    return { name: type, status: 'denied', granted: false, permanentlyDenied: false };
  }
}

export const permissionManager = new PermissionManager();

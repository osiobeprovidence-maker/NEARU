import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  AppPermissionType,
  PermissionStatus,
  PermissionCheckResult,
  PermissionRequestResult,
  PermissionDialogConfig,
  PERMISSION_CONFIGS,
  permissionManager,
} from '../services/permissionManager';
import PermissionRationaleModal from '../components/PermissionRationaleModal';

interface PermissionContextType {
  statuses: Record<AppPermissionType, PermissionCheckResult>;
  apiLevel: number;
  isNative: boolean;
  refreshStatuses: () => Promise<void>;
  checkPermission: (type: AppPermissionType) => Promise<PermissionCheckResult>;
  requestWithRationale: (
    type: AppPermissionType,
    options?: { force?: boolean }
  ) => Promise<PermissionRequestResult>;
  openSettings: () => Promise<void>;
}

const defaultStatus = (name: AppPermissionType): PermissionCheckResult => ({
  name,
  status: 'prompt',
});

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<Record<AppPermissionType, PermissionCheckResult>>({
    location: defaultStatus('location'),
    camera: defaultStatus('camera'),
    microphone: defaultStatus('microphone'),
    notifications: defaultStatus('notifications'),
    contacts: defaultStatus('contacts'),
  });
  const [apiLevel, setApiLevel] = useState<number>(0);
  const isNative = permissionManager.isNative();

  // Modal dialog state
  const [modalConfig, setModalConfig] = useState<PermissionDialogConfig | null>(null);
  const [activeResolver, setActiveResolver] = useState<((allowed: boolean) => void) | null>(null);

  const refreshStatuses = useCallback(async () => {
    try {
      const all = await permissionManager.checkAllPermissions();
      setStatuses(all);
      const lvl = await permissionManager.getApiLevel();
      setApiLevel(lvl);
    } catch (err) {
      console.warn('[PermissionContext] refreshStatuses error:', err);
    }
  }, []);

  useEffect(() => {
    refreshStatuses();

    // Re-check permissions when app regains focus or visibility (e.g. after returning from Android Settings)
    const handleFocus = () => {
      refreshStatuses();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshStatuses();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshStatuses]);

  const checkPermission = useCallback(async (type: AppPermissionType) => {
    const res = await permissionManager.checkPermission(type);
    setStatuses((prev) => ({ ...prev, [type]: res }));
    return res;
  }, []);

  const openSettings = useCallback(async () => {
    await permissionManager.openAppSettings();
  }, []);

  const promptUserDialog = useCallback(
    (config: PermissionDialogConfig): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setModalConfig(config);
        setActiveResolver(() => (allowed: boolean) => {
          setModalConfig(null);
          setActiveResolver(null);
          resolve(allowed);
        });
      });
    },
    []
  );

  const requestWithRationale = useCallback(
    async (type: AppPermissionType, options?: { force?: boolean }): Promise<PermissionRequestResult> => {
      // 1. Check current real-time status
      const current = await checkPermission(type);

      // Already granted -> immediate success
      if (current.status === 'granted') {
        return {
          name: type,
          status: 'granted',
          isPrecise: current.isPrecise,
          granted: true,
          permanentlyDenied: false,
        };
      }

      const configGroup = PERMISSION_CONFIGS[type];

      // 2. Permanently denied -> settings recovery
      if (current.status === 'permanently_denied') {
        // If this request was triggered explicitly, show recovery dialog
        const userAccepted = await promptUserDialog({
          type,
          isSettingsRecovery: true,
          title: configGroup.settings.title,
          description: configGroup.settings.description,
          confirmLabel: configGroup.settings.confirmLabel,
          cancelLabel: configGroup.settings.cancelLabel,
        });

        if (userAccepted) {
          await openSettings();
        }

        return {
          name: type,
          status: 'permanently_denied',
          isPrecise: false,
          granted: false,
          permanentlyDenied: true,
        };
      }

      // 3. Pre-Rationale Dialog: Explain to user before Android OS dialog
      const userAllowedRationale = await promptUserDialog({
        type,
        isSettingsRecovery: false,
        title: configGroup.rationale.title,
        description: configGroup.rationale.description,
        confirmLabel: configGroup.rationale.confirmLabel,
        cancelLabel: configGroup.rationale.cancelLabel,
      });

      if (!userAllowedRationale) {
        // User clicked "Not Now"
        permissionManager.markDismissed(type);
        return {
          name: type,
          status: 'denied',
          isPrecise: false,
          granted: false,
          permanentlyDenied: false,
        };
      }

      // 4. User chose "Allow" -> trigger Android OS runtime permission request
      const osResult = await permissionManager.requestDirect(type);
      setStatuses((prev) => ({
        ...prev,
        [type]: {
          name: type,
          status: osResult.status,
          isPrecise: osResult.isPrecise,
          apiLevel,
        },
      }));

      return osResult;
    },
    [checkPermission, promptUserDialog, openSettings, apiLevel]
  );

  const handleModalConfirm = () => {
    if (activeResolver) activeResolver(true);
  };

  const handleModalCancel = () => {
    if (activeResolver) activeResolver(false);
  };

  return (
    <PermissionContext.Provider
      value={{
        statuses,
        apiLevel,
        isNative,
        refreshStatuses,
        checkPermission,
        requestWithRationale,
        openSettings,
      }}
    >
      {children}
      <PermissionRationaleModal
        isOpen={modalConfig !== null}
        config={modalConfig}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

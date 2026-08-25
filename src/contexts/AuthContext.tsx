import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, PrivacySettings, NotificationSettings, AppSettings, TrustedContact, BlockedUser } from '../types';
import { currentUser as initialCurrentUser } from '../data/mock';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User;
  login: () => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  verifyNIN: (nin: string) => Promise<boolean>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  addTrustedContact: (contact: Omit<TrustedContact, 'id'>) => void;
  removeTrustedContact: (id: string) => void;
  unblockUser: (userId: string) => void;
  clearAppCache: () => void;
}

const defaultPrivacySettings: PrivacySettings = {
  profileVisibility: 'public',
  locationPrecision: 'approximate',
  whoCanMessage: 'everyone',
  showOnlineStatus: true,
  showReadReceipts: true,
};

const defaultNotificationSettings: NotificationSettings = {
  pushEnabled: true,
  rallyMatches: true,
  chatMessages: true,
  activityReminders: true,
  safetyAlerts: true,
  emailDigest: false,
  marketingUpdates: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

const defaultAppSettings: AppSettings = {
  theme: 'system',
  language: 'English (US)',
  dataSaver: false,
  autoPlayMedia: true,
  cacheSizeMB: 24.8,
};

const defaultTrustedContacts: TrustedContact[] = [
  {
    id: 'tc-1',
    name: 'Ada Johnson',
    phone: '+234 803 123 4567',
    relationship: 'Sister',
  }
];

const defaultBlockedUsers: BlockedUser[] = [
  {
    id: 'block-1',
    name: 'Spam Bot 3000',
    username: '@bot3000',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    blockedAt: '2 days ago',
  }
];

const initialUserState: User = {
  ...initialCurrentUser,
  email: 'alex.johnson@example.com',
  phone: '+234 812 345 6789',
  gender: 'Male',
  birthday: '1998-05-14',
  interests: ['Outdoor & Sports', 'Social Hangouts', 'Music & Events', 'Tech & Gaming'],
  privacySettings: defaultPrivacySettings,
  notificationSettings: defaultNotificationSettings,
  appSettings: defaultAppSettings,
  trustedContacts: defaultTrustedContacts,
  blockedUsers: defaultBlockedUsers,
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: true,
  user: initialUserState,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  verifyNIN: async () => true,
  updatePrivacySettings: () => {},
  updateNotificationSettings: () => {},
  updateAppSettings: () => {},
  addTrustedContact: () => {},
  removeTrustedContact: () => {},
  unblockUser: () => {},
  clearAppCache: () => {},
});

const STORAGE_KEY = 'rally_user_profile_v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...initialUserState, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return initialUserState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      return updated;
    });
  };

  const verifyNIN = async (nin: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setUser((prev) => {
      const currentBadges = prev.badges || [];
      const updatedBadges = currentBadges.includes('NIN Verified')
        ? currentBadges
        : [...currentBadges, 'NIN Verified'];

      return {
        ...prev,
        nin,
        isNINVerified: true,
        badges: updatedBadges,
      };
    });
    return true;
  };

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    setUser((prev) => ({
      ...prev,
      privacySettings: {
        ...(prev.privacySettings || defaultPrivacySettings),
        ...settings,
      },
    }));
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setUser((prev) => ({
      ...prev,
      notificationSettings: {
        ...(prev.notificationSettings || defaultNotificationSettings),
        ...settings,
      },
    }));
  };

  const updateAppSettings = (settings: Partial<AppSettings>) => {
    setUser((prev) => ({
      ...prev,
      appSettings: {
        ...(prev.appSettings || defaultAppSettings),
        ...settings,
      },
    }));
  };

  const addTrustedContact = (contact: Omit<TrustedContact, 'id'>) => {
    const newContact: TrustedContact = {
      ...contact,
      id: `tc-${Date.now()}`,
    };
    setUser((prev) => ({
      ...prev,
      trustedContacts: [...(prev.trustedContacts || []), newContact],
    }));
  };

  const removeTrustedContact = (id: string) => {
    setUser((prev) => ({
      ...prev,
      trustedContacts: (prev.trustedContacts || []).filter((c) => c.id !== id),
    }));
  };

  const unblockUser = (userId: string) => {
    setUser((prev) => ({
      ...prev,
      blockedUsers: (prev.blockedUsers || []).filter((u) => u.id !== userId),
    }));
  };

  const clearAppCache = () => {
    setUser((prev) => ({
      ...prev,
      appSettings: {
        ...(prev.appSettings || defaultAppSettings),
        cacheSizeMB: 0.1,
      },
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login: () => setIsLoggedIn(true),
        logout: () => setIsLoggedIn(false),
        updateUser,
        verifyNIN,
        updatePrivacySettings,
        updateNotificationSettings,
        updateAppSettings,
        addTrustedContact,
        removeTrustedContact,
        unblockUser,
        clearAppCache,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);


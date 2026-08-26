import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, PrivacySettings, NotificationSettings, AppSettings, TrustedContact, BlockedUser } from '../types';
import { currentUser as initialCurrentUser } from '../data/mock';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  reload,
} from '../lib/firebase';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  user: User;
  firebaseUser: FirebaseUser | null;
  register: (email: string, password: string) => Promise<void>;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  waitForEmailVerification: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  setupTOTP: (email: string) => Promise<{ secret: string; qrCode: string }>;
  verifyTOTP: (secret: string, token: string) => Promise<boolean>;
  saveUserToConvex: (data: {
    name: string;
    username: string;
    email: string;
    passwordHash: string;
    totpSecret?: string;
    totpEnabled?: boolean;
    isEmailVerified: boolean;
  }) => Promise<string>;
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
  isLoggedIn: false,
  isAuthLoading: true,
  user: initialUserState,
  firebaseUser: null,
  register: async () => {},
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
  waitForEmailVerification: async () => false,
  resendVerificationEmail: async () => {},
  setupTOTP: async () => ({ secret: '', qrCode: '' }),
  verifyTOTP: async () => false,
  saveUserToConvex: async () => '',
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
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
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const isLoggedIn = !!firebaseUser;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  const register = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user, {
      url: window.location.origin,
      handleCodeInApp: true,
    });
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser, {
      url: window.location.origin,
      handleCodeInApp: true,
    });
  };

  const waitForEmailVerification = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await reload(auth.currentUser);
    return !!auth.currentUser.emailVerified;
  };

  const setupTOTP = async (email: string) => {
    const res = await fetch('/api/totp-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to setup TOTP');
    return data;
  };

  const verifyTOTP = async (secret: string, token: string) => {
    const res = await fetch('/api/totp-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid code');
    return data.valid;
  };

  const saveUserToConvex = async (data: {
    name: string;
    username: string;
    email: string;
    passwordHash: string;
    totpSecret?: string;
    totpEnabled?: boolean;
    isEmailVerified: boolean;
  }) => {
    const res = await fetch('/api/save-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save user');
    return result.userId;
  };

  const login = async (emailOrUsername: string, password: string) => {
    let email = emailOrUsername;
    if (!emailOrUsername.includes('@')) {
      const res = await fetch('/api/login-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: emailOrUsername }),
      });
      const data = await res.json();
      if (!res.ok || !data.email) throw new Error('Username not found');
      email = data.email;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

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
        isAuthLoading,
        user,
        firebaseUser,
        register,
        login,
        logout,
        updateUser,
        waitForEmailVerification,
        resendVerificationEmail,
        setupTOTP,
        verifyTOTP,
        saveUserToConvex,
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

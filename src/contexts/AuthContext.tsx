import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, PrivacySettings, NotificationSettings, AppSettings, TrustedContact, BlockedUser } from '../types';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  reload,
} from '../lib/firebase';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface AuthContextType {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  isProfileLoading: boolean;
  hasConvexProfile: boolean;
  user: User;
  convexUserId: string | null;
  firebaseUser: FirebaseUser | null;
  register: (email: string, password: string) => Promise<void>;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  loginWithMagicLink: () => Promise<boolean>;
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
  updateUserVerification: () => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  addTrustedContact: (contact: Omit<TrustedContact, 'id'>) => void;
  removeTrustedContact: (id: string) => void;
  blockUser: (id: string, name: string, username: string, avatar: string) => void;
  unblockUser: (userId: string) => void;
  clearAppCache: () => void;
  persistProfile: (updates: {
    bio?: string;
    location?: string;
    interests?: string[];
    showInterests?: boolean;
  }) => Promise<void>;
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

const EMPTY_USER: User = {
  id: '',
  name: '',
  username: '',
  avatar: '',
  isNINVerified: false,
  isPhoneVerified: false,
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAuthLoading: true,
  isProfileLoading: true,
  hasConvexProfile: false,
  user: EMPTY_USER,
  convexUserId: null,
  firebaseUser: null,
  register: async () => {},
  login: async () => {},
  sendMagicLink: async () => {},
  loginWithMagicLink: async () => false,
  logout: () => {},
  updateUser: () => {},
  waitForEmailVerification: async () => false,
  resendVerificationEmail: async () => {},
  setupTOTP: async () => ({ secret: '', qrCode: '' }),
  verifyTOTP: async () => false,
  saveUserToConvex: async () => '',
  updateUserVerification: async () => {},
  updatePrivacySettings: () => {},
  updateNotificationSettings: () => {},
  updateAppSettings: () => {},
  addTrustedContact: () => {},
  removeTrustedContact: () => {},
  blockUser: () => {},
  unblockUser: () => {},
  clearAppCache: () => {},
  persistProfile: async () => {},
});

const STORAGE_KEY = 'rally_user_profile_v1';

function convexUserToUser(cu: any, firebaseEmail: string): User {
  return {
    id: cu._id,
    name: cu.name || '',
    username: cu.username || '',
    avatar: cu.avatar || '',
    email: cu.email || firebaseEmail,
    phone: cu.phone,
    nin: cu.nin,
    gender: cu.gender,
    birthday: cu.birthday,
    interests: cu.interests,
    isNINVerified: cu.isNINVerified ?? false,
    isPhoneVerified: cu.isPhoneVerified ?? false,
    badges: cu.badges,
    bio: cu.bio,
    location: cu.location,
    showInterests: cu.showInterests,
    stats: cu.rallies != null ? {
      rallies: cu.rallies ?? 0,
      completed: cu.completed ?? 0,
      rating: cu.rating ?? 0,
    } : undefined,
    privacySettings: cu.privacySettings,
    notificationSettings: cu.notificationSettings,
    appSettings: cu.appSettings,
    trustedContacts: cu.trustedContacts,
    blockedUsers: cu.blockedUsers,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<User>(EMPTY_USER);
  const [convexUserId, setConvexUserId] = useState<string | null>(() => {
    return localStorage.getItem('rally_convex_user_id');
  });
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [hasConvexProfile, setHasConvexProfile] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  const queryEmail = firebaseUser?.email || undefined;
  const queryResult = useQuery(api.users.getByEmail, queryEmail !== undefined ? { email: queryEmail } : 'skip');
  const convexCreateUser = useMutation(api.users.create);
  const convexUpdateAuth = useMutation(api.users.updateAuth);
  const convexGetOrCreateByEmail = useMutation(api.users.getOrCreateByEmail);
  const convexUpdatePrivacy = useMutation(api.users.updatePrivacySettings);
  const convexUpdateNotifications = useMutation(api.users.updateNotificationSettings);
  const convexUpdateApp = useMutation(api.users.updateAppSettings);
  const convexUnblock = useMutation(api.users.unblockUser);
  const convexBlock = useMutation(api.users.addBlockedUser);
  const convexUpdateUser = useMutation(api.users.update);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setIsAuthLoading(false);
      if (!fbUser) {
        setConvexUserId(null);
        setHasConvexProfile(false);
        setUser(EMPTY_USER);
        setIsProfileLoading(false);
        setProfileChecked(true);
        localStorage.removeItem('rally_convex_user_id');
        localStorage.removeItem(STORAGE_KEY);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (firebaseUser === null) return;

    if (queryResult === undefined) {
      setIsProfileLoading(true);
      return;
    }

    if (queryResult === null) {
      setHasConvexProfile(false);
      setConvexUserId(null);
      setIsProfileLoading(false);
      setProfileChecked(true);
      return;
    }

    const u = convexUserToUser(queryResult, firebaseUser.email || '');
    setUser(u);
    setConvexUserId(queryResult._id);
    setHasConvexProfile(true);
    setIsProfileLoading(false);
    setProfileChecked(true);
    localStorage.setItem('rally_convex_user_id', queryResult._id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, [firebaseUser, queryResult]);

  useEffect(() => {
    if (!firebaseUser || !profileChecked || hasConvexProfile || convexUserId) return;

    const syncExistingUser = async () => {
      try {
        const userId = await convexGetOrCreateByEmail({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          username: firebaseUser.email?.split('@')[0] || 'user',
          email: firebaseUser.email || '',
        });
        if (userId) {
          setConvexUserId(userId);
          localStorage.setItem('rally_convex_user_id', userId);
        }
      } catch (err) {
        console.error('Failed to sync existing user to Convex:', err);
      }
    };

    syncExistingUser();
  }, [firebaseUser, profileChecked, hasConvexProfile, convexUserId, convexGetOrCreateByEmail]);

  const isLoggedIn = !!firebaseUser;

  const register = async (email: string, password: string) => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin,
        handleCodeInApp: true,
      });
      return;
    }
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
    const userId = await convexCreateUser({
      name: data.name,
      username: data.username,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=6366f1&color=fff&bold=true&size=200`,
      email: data.email,
      isNINVerified: false,
      isPhoneVerified: false,
      isEmailVerified: data.isEmailVerified,
      passwordHash: data.passwordHash || undefined,
    });
    if (data.totpSecret || data.totpEnabled) {
      await convexUpdateAuth({
        userId: userId as any,
        totpSecret: data.totpSecret || undefined,
        totpEnabled: data.totpEnabled || false,
      });
    }
    return userId;
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

  const sendMagicLink = async (email: string) => {
    const actionCodeSettings = {
      url: window.location.origin,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem('rally_email_for_signin', email);
  };

  const loginWithMagicLink = async (): Promise<boolean> => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return false;
    let email = localStorage.getItem('rally_email_for_signin');
    if (!email) {
      email = window.prompt('Please enter your email to confirm');
    }
    if (!email) return false;
    await signInWithEmailLink(auth, email, window.location.href);
    localStorage.removeItem('rally_email_for_signin');
    return true;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateUserVerification = () => {
    setUser((prev) => {
      const currentBadges = prev.badges || [];
      const updatedBadges = currentBadges.includes('NIN Verified')
        ? currentBadges
        : [...currentBadges, 'NIN Verified'];
      const updated = {
        ...prev,
        isNINVerified: true,
        badges: updatedBadges,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        privacySettings: {
          ...(prev.privacySettings || defaultPrivacySettings),
          ...settings,
        },
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (convexUserId) {
      const current = user.privacySettings || defaultPrivacySettings;
      const merged = { ...current, ...settings };
      convexUpdatePrivacy({
        userId: convexUserId as any,
        profileVisibility: merged.profileVisibility,
        locationPrecision: merged.locationPrecision,
        whoCanMessage: merged.whoCanMessage,
        showOnlineStatus: merged.showOnlineStatus,
        showReadReceipts: merged.showReadReceipts,
      }).catch((err) => console.error('Failed to persist privacy settings:', err));
    }
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        notificationSettings: {
          ...(prev.notificationSettings || defaultNotificationSettings),
          ...settings,
        },
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (convexUserId) {
      const current = user.notificationSettings || defaultNotificationSettings;
      const merged = { ...current, ...settings };
      convexUpdateNotifications({
        userId: convexUserId as any,
        pushEnabled: merged.pushEnabled,
        rallyMatches: merged.rallyMatches,
        chatMessages: merged.chatMessages,
        activityReminders: merged.activityReminders,
        safetyAlerts: merged.safetyAlerts,
        emailDigest: merged.emailDigest,
        marketingUpdates: merged.marketingUpdates,
        soundEnabled: merged.soundEnabled,
        vibrationEnabled: merged.vibrationEnabled,
      }).catch((err) => console.error('Failed to persist notification settings:', err));
    }
  };

  const updateAppSettings = (settings: Partial<AppSettings>) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        appSettings: {
          ...(prev.appSettings || defaultAppSettings),
          ...settings,
        },
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (convexUserId) {
      const current = user.appSettings || defaultAppSettings;
      const merged = { ...current, ...settings };
      convexUpdateApp({
        userId: convexUserId as any,
        theme: merged.theme,
        language: merged.language,
        dataSaver: merged.dataSaver,
        autoPlayMedia: merged.autoPlayMedia,
        cacheSizeMB: merged.cacheSizeMB,
      }).catch((err) => console.error('Failed to persist app settings:', err));
    }
  };

  const addTrustedContact = (contact: Omit<TrustedContact, 'id'>) => {
    const newContact: TrustedContact = {
      ...contact,
      id: `tc-${Date.now()}`,
    };
    setUser((prev) => {
      const updated = {
        ...prev,
        trustedContacts: [...(prev.trustedContacts || []), newContact],
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const removeTrustedContact = (id: string) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        trustedContacts: (prev.trustedContacts || []).filter((c) => c.id !== id),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const blockUser = (id: string, name: string, username: string, avatar: string) => {
    setUser((prev) => {
      if ((prev.blockedUsers || []).some((u) => u.id === id)) return prev;
      const updated = {
        ...prev,
        blockedUsers: [
          ...(prev.blockedUsers || []),
          { id, name, username, avatar, blockedAt: new Date().toISOString() },
        ],
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (convexUserId) {
      convexBlock({
        userId: convexUserId as any,
        blockedUser: {
          id,
          name,
          username,
          avatar,
          blockedAt: new Date().toISOString(),
        },
      }).catch((err) => console.error('Failed to persist block:', err));
    }
  };

  const unblockUser = (userId: string) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        blockedUsers: (prev.blockedUsers || []).filter((u) => u.id !== userId),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (convexUserId) {
      convexUnblock({
        userId: convexUserId as any,
        blockedId: userId,
      }).catch((err) => console.error('Failed to persist unblock:', err));
    }
  };

  const persistProfile = async (updates: {
    bio?: string;
    location?: string;
    interests?: string[];
    showInterests?: boolean;
  }) => {
    if (convexUserId) {
      await convexUpdateUser({
        userId: convexUserId as any,
        bio: updates.bio,
        location: updates.location,
        interests: updates.interests,
        showInterests: updates.showInterests,
      });
    }
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
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
        isProfileLoading,
        hasConvexProfile,
        user,
        convexUserId,
        firebaseUser,
        register,
        login,
        sendMagicLink,
        loginWithMagicLink,
        logout,
        updateUser,
        waitForEmailVerification,
        resendVerificationEmail,
        setupTOTP,
        verifyTOTP,
        saveUserToConvex,
        updateUserVerification,
        updatePrivacySettings,
        updateNotificationSettings,
        updateAppSettings,
        addTrustedContact,
        removeTrustedContact,
        blockUser,
        unblockUser,
        clearAppCache,
        persistProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

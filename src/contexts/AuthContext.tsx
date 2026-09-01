import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, PrivacySettings, NotificationSettings, AppSettings, TrustedContact, BlockedUser } from '../types';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  reload,
} from '../lib/firebase';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContextType {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  isProfileLoading: boolean;
  hasConvexProfile: boolean;
  isPro: boolean;
  user: User;
  convexUserId: string | null;
  firebaseUser: FirebaseUser | null;
  // Auth actions
  login: (emailOrUsername: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  loginWithMagicLink: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  // Profile helpers
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
    publicInterests?: string[];
    showInterests?: boolean;
  }) => Promise<void>;
  grantPro: () => Promise<void>;
  setAccountType: (
    type: 'personal' | 'organization' | 'business',
    organizationName?: string
  ) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

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
  accountType: 'personal',
  isPro: false,
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAuthLoading: true,
  isProfileLoading: true,
  hasConvexProfile: false,
  isPro: false,
  user: EMPTY_USER,
  convexUserId: null,
  firebaseUser: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  sendMagicLink: async () => {},
  loginWithMagicLink: async () => false,
  resetPassword: async () => {},
  logout: () => {},
  updateUser: () => {},
  waitForEmailVerification: async () => false,
  resendVerificationEmail: async () => {},
  setupTOTP: async () => ({ secret: '', qrCode: '' }),
  verifyTOTP: async () => false,
  saveUserToConvex: async () => '',
  updateUserVerification: () => {},
  updatePrivacySettings: () => {},
  updateNotificationSettings: () => {},
  updateAppSettings: () => {},
  addTrustedContact: () => {},
  removeTrustedContact: () => {},
  blockUser: () => {},
  unblockUser: () => {},
  clearAppCache: () => {},
  persistProfile: async () => {},
  grantPro: async () => {},
  setAccountType: async () => {},
});

const STORAGE_KEY = 'rally_user_profile_v1';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    publicInterests: cu.publicInterests,
    isNINVerified: cu.isNINVerified ?? false,
    isPhoneVerified: cu.isPhoneVerified ?? false,
    badges: cu.badges,
    bio: cu.bio,
    location: cu.location,
    accountType: cu.accountType || 'personal',
    isPro: cu.isPro ?? false,
    organizationName: cu.organizationName,
    coverImage: cu.coverImage,
    description: cu.description,
    website: cu.website,
    category: cu.category,
    socialLinks: cu.socialLinks,
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

/**
 * Translate raw Firebase auth error codes into friendly user-facing messages.
 * The technical code is preserved on err.code so dev logs still have it.
 */
function friendlyAuthError(err: any): string {
  const code: string = err?.code || '';
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Your email or password is incorrect.';
  }
  if (code === 'auth/email-already-in-use') return 'An account with this email already exists.';
  if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/user-disabled') return 'This account has been disabled.';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in was cancelled.';
  }
  if (code === 'auth/popup-blocked') return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
  if (code === 'auth/network-request-failed') return 'Something went wrong. Please check your connection and try again.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.';
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email using a different sign-in method.';
  }
  return err?.message || 'Something went wrong. Please try again.';
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<User>(EMPTY_USER);
  // The cached Convex user ID from localStorage is treated as a hint only.
  // The live getByFirebaseUid query always overrides it once resolved.
  const [convexUserId, setConvexUserId] = useState<string | null>(() => {
    return localStorage.getItem('rally_convex_user_id');
  });
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [hasConvexProfile, setHasConvexProfile] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // ---------------------------------------------------------------------------
  // Primary Convex lookup — keyed on Firebase UID (fast, stable, no duplicates)
  // Falls back to email lookup for legacy users via getOrCreateByFirebaseUid.
  // ---------------------------------------------------------------------------
  // Guard: never pass an empty string to the query — Convex will reject it.
  const queryUid = (firebaseUser?.uid && firebaseUser.uid.length > 0)
    ? firebaseUser.uid
    : undefined;
  const uidQueryResult = useQuery(
    api.users.getByFirebaseUid,
    queryUid !== undefined ? { firebaseUid: queryUid } : 'skip'
  );

  // Convex mutations
  const convexCreateUser = useMutation(api.users.create);
  const convexUpdateAuth = useMutation(api.users.updateAuth);
  const convexGetOrCreateByFirebaseUid = useMutation(api.users.getOrCreateByFirebaseUid);
  const convexLinkFirebaseUid = useMutation(api.users.linkFirebaseUid);
  const convexUpdatePrivacy = useMutation(api.users.updatePrivacySettings);
  const convexUpdateNotifications = useMutation(api.users.updateNotificationSettings);
  const convexUpdateApp = useMutation(api.users.updateAppSettings);
  const convexUnblock = useMutation(api.users.unblockUser);
  const convexBlock = useMutation(api.users.addBlockedUser);
  const convexUpdateUser = useMutation(api.users.update);
  const convexSetPro = useMutation(api.users.setPro);
  const convexSetAccountType = useMutation(api.users.setAccountType);

  // ---------------------------------------------------------------------------
  // Firebase auth state listener
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Sync Convex profile whenever the UID-based query result changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (firebaseUser === null) return;

    if (uidQueryResult === undefined) {
      setIsProfileLoading(true);
      return;
    }

    if (uidQueryResult === null) {
      // No Convex record for this Firebase UID yet.
      // The syncNewUser effect below will call getOrCreateByFirebaseUid.
      setHasConvexProfile(false);
      setConvexUserId(null);
      setIsProfileLoading(false);
      setProfileChecked(true);
      localStorage.removeItem('rally_convex_user_id');
      return;
    }

    // Found — the live query result is always authoritative.
    const u = convexUserToUser(uidQueryResult, firebaseUser.email || '');
    setUser(u);
    setConvexUserId(uidQueryResult._id);
    setHasConvexProfile(true);
    setIsProfileLoading(false);
    setProfileChecked(true);
    localStorage.setItem('rally_convex_user_id', uidQueryResult._id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));

    // One-time migration: if the record was found but lacks firebaseUid
    // (shouldn't happen via getByFirebaseUid, but guard anyway).
    if (!(uidQueryResult as any).firebaseUid) {
      convexLinkFirebaseUid({
        userId: uidQueryResult._id as any,
        firebaseUid: firebaseUser.uid,
      }).catch(() => {});
    }
  }, [firebaseUser, uidQueryResult]);

  // ---------------------------------------------------------------------------
  // Auto-create or migrate a Convex record for a Firebase user with no profile.
  // Handles: new Google sign-ins, new email sign-ups before onboarding completes,
  // and legacy email-only users (the mutation handles the email-migration path).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!firebaseUser || !profileChecked || hasConvexProfile || convexUserId) return;

    const syncNewUser = async () => {
      try {
        const result = await convexGetOrCreateByFirebaseUid({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL || undefined,
          provider: firebaseUser.providerData?.[0]?.providerId || 'password',
        });
        if (result?.userId) {
          setConvexUserId(result.userId);
          localStorage.setItem('rally_convex_user_id', result.userId);
          // If a new record was just created for a Google user we have a
          // profile, but hasConvexProfile will be set true by the UID query
          // once it re-fires. For newly-onboarded email users, hasConvexProfile
          // stays false so they're routed to /onboarding to fill in username etc.
        }
      } catch (err) {
        console.error('[AuthContext] syncNewUser failed:', err);
      }
    };

    syncNewUser();
  }, [firebaseUser, profileChecked, hasConvexProfile, convexUserId, convexGetOrCreateByFirebaseUid]);

  const isLoggedIn = !!firebaseUser;

  // ---------------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------------

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
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged fires → uidQueryResult re-evaluates →
      // syncNewUser runs if no Convex record exists.
      // The calling page should navigate to '/' after this resolves.
    } catch (err: any) {
      // Re-throw with a friendly message so the UI can display it.
      throw new Error(friendlyAuthError(err));
    }
  };

  const register = async (email: string, password: string) => {
    try {
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
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
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

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      // For security, don't reveal whether the email exists.
      // Log the real error server-side but show a generic message.
      console.error('[AuthContext] resetPassword error:', err?.code, err?.message);
      // Only surface hard errors (invalid email format etc).
      if (err?.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      // Otherwise swallow — we show "if an account exists we've sent a link"
    }
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

  // ---------------------------------------------------------------------------
  // TOTP (serverless-backed)
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Convex user creation (called from the end of onboarding)
  // ---------------------------------------------------------------------------

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
    // Link the Firebase UID to the freshly-created Convex record so
    // future lookups use the fast uid-indexed path.
    if (firebaseUser) {
      await convexLinkFirebaseUid({
        userId: userId as any,
        firebaseUid: firebaseUser.uid,
      }).catch(() => {});
    }
    if (data.totpSecret || data.totpEnabled) {
      await convexUpdateAuth({
        userId: userId as any,
        totpSecret: data.totpSecret || undefined,
        totpEnabled: data.totpEnabled || false,
      });
    }
    return userId;
  };

  // ---------------------------------------------------------------------------
  // Local user state helpers
  // ---------------------------------------------------------------------------

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const updateUserVerification = () => {
    setUser((prev) => {
      const currentBadges = prev.badges || [];
      const updatedBadges = currentBadges.includes('NIN Verified')
        ? currentBadges
        : [...currentBadges, 'NIN Verified'];
      const updated = { ...prev, isNINVerified: true, badges: updatedBadges };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // ---------------------------------------------------------------------------
  // Settings persistence — local + Convex
  // ---------------------------------------------------------------------------

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        privacySettings: { ...(prev.privacySettings || defaultPrivacySettings), ...settings },
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
        notificationSettings: { ...(prev.notificationSettings || defaultNotificationSettings), ...settings },
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
        appSettings: { ...(prev.appSettings || defaultAppSettings), ...settings },
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
    const newContact: TrustedContact = { ...contact, id: `tc-${Date.now()}` };
    setUser((prev) => {
      const updated = { ...prev, trustedContacts: [...(prev.trustedContacts || []), newContact] };
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
        blockedUser: { id, name, username, avatar, blockedAt: new Date().toISOString() },
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
      convexUnblock({ userId: convexUserId as any, blockedId: userId })
        .catch((err) => console.error('Failed to persist unblock:', err));
    }
  };

  const persistProfile = async (updates: {
    bio?: string;
    location?: string;
    interests?: string[];
    publicInterests?: string[];
    showInterests?: boolean;
  }) => {
    if (convexUserId) {
      await convexUpdateUser({
        userId: convexUserId as any,
        bio: updates.bio,
        location: updates.location,
        interests: updates.interests,
        publicInterests: updates.publicInterests,
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
      appSettings: { ...(prev.appSettings || defaultAppSettings), cacheSizeMB: 0.1 },
    }));
  };

  const grantPro = async () => {
    if (!convexUserId) throw new Error('Not logged in');
    await convexSetPro({ userId: convexUserId as any, isPro: true });
    setUser((prev) => {
      const updated = { ...prev, isPro: true };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const setAccountType = async (
    type: 'personal' | 'organization' | 'business',
    organizationName?: string
  ) => {
    if (!convexUserId) throw new Error('Not logged in');
    const res = await convexSetAccountType({
      userId: convexUserId as any,
      accountType: type,
      organizationName,
    });
    setUser((prev) => {
      const updated = {
        ...prev,
        accountType: res.accountType as User['accountType'],
        organizationName: res.organizationName,
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const isPro = !!user.isPro;

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAuthLoading,
        isProfileLoading,
        hasConvexProfile,
        isPro,
        user,
        convexUserId,
        firebaseUser,
        login,
        loginWithGoogle,
        register,
        sendMagicLink,
        loginWithMagicLink,
        resetPassword,
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
        grantPro,
        setAccountType,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

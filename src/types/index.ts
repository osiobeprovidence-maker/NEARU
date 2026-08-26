export type ActivityType = 'ASK' | 'HELP' | 'JOIN';

export interface PrivacySettings {
  profileVisibility: 'public' | 'verified_only' | 'private';
  locationPrecision: 'approximate' | 'exact' | 'city_only';
  whoCanMessage: 'everyone' | 'verified_only' | 'mutual_interest';
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  rallyMatches: boolean;
  chatMessages: boolean;
  activityReminders: boolean;
  safetyAlerts: boolean;
  emailDigest: boolean;
  marketingUpdates: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  language: string;
  dataSaver: boolean;
  autoPlayMedia: boolean;
  cacheSizeMB: number;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface BlockedUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  blockedAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  email?: string;
  phone?: string;
  nin?: string;
  gender?: string;
  birthday?: string;
  interests?: string[];
  isNINVerified: boolean;
  isPhoneVerified: boolean;
  badges?: string[];
  bio?: string;
  location?: string;
  stats?: {
    rallies: number;
    completed: number;
    rating: number;
  };
  privacySettings?: PrivacySettings;
  notificationSettings?: NotificationSettings;
  appSettings?: AppSettings;
  trustedContacts?: TrustedContact[];
  blockedUsers?: BlockedUser[];
}

export interface Rally {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  distance: number;
  time: string;
  peopleNeeded: number;
  peopleInterested: number;
  isPaid: boolean;
  price?: number;
  creator: User;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  city?: string;
  locationLabel?: string;
  rallyLatitude?: number;
  rallyLongitude?: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  rallyId: string;
  rallyTitle: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
}


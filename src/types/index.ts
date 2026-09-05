export type ActivityType = 'ASK' | 'HELP' | 'JOIN' | 'EVENT' | 'POST';

export type RallyCategory = 'sports' | 'music' | 'gaming' | 'social' | 'work' | 'education' | 'creative' | 'fitness' | 'travel' | 'food' | 'general';

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
  /** Up to 3 interest tags the user opts to show publicly on their profile.
   *  Distinct from `interests` which is the private/personalization list. */
  publicInterests?: string[];
  isNINVerified: boolean;
  isPhoneVerified: boolean;
  badges?: string[];
  bio?: string;
  location?: string;
  accountType?: 'personal' | 'organization' | 'business';
  isPro?: boolean;
  organizationName?: string;
  coverImage?: string;
  description?: string;
  website?: string;
  category?: string;
  socialLinks?: { platform: string; url: string }[];
  showInterests?: boolean;
  /** User's self-selected pronoun (e.g. "He/Him", "She/Her", "They/Them", custom).
   *  Never inferred from any other field. Optional — absence means not disclosed. */
  pronouns?: string;
  /** Whether the pronoun is shown publicly on the profile. Defaults to false. */
  showPronouns?: boolean;
  /** True once the user has finished the onboarding wizard.
   *  Existing accounts without this field are treated as completed. */
  onboardingCompleted?: boolean;
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

export interface Page {
  _id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  email?: string;
  phone?: string;
  location?: string;
  creatorId?: string;
  isVerified?: boolean;
  createdAt?: number;
  followersCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  viewerRole?: 'owner' | 'admin' | 'editor' | 'moderator' | null;
}

export interface PageMember {
  _id: string;
  pageId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'moderator';
  createdAt: number;
  user?: User;
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
  /** Access model: 'free' = FREE, 'paid' = charged admission, 'none' = no admission fee. */
  pricing?: 'free' | 'paid' | 'none';
  creator: User;
  authorType?: 'user' | 'page';
  pageId?: string;
  created_by_user_id?: string;
  pageAuthor?: Page;
  status: 'ACTIVE' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  city?: string;
  locationLabel?: string;
  rallyLatitude?: number;
  rallyLongitude?: number;
  category?: RallyCategory;
  hashtags?: string[];
  eventDate?: string;
  endTime?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  capacity?: number;
  likesCount?: number;
  commentsCount?: number;
  rsvpsCount?: number;
  isLiked?: boolean;
  isRsvpd?: boolean;
  // Event Hub fields
  eventTag?: string;
  interests?: string[];
  scoring?: 'sum_scores' | 'matches_won' | 'total_points';
  rallyLinkId?: string;
  linkedEvent?: string;
  participantCount?: number;
  followerCount?: number;
  isParticipant?: boolean;
  isFollowing?: boolean;
}

export interface RallyParticipant {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar: string;
  role?: 'organizer' | 'participant';
  isNINVerified?: boolean;
}

export interface RallyResult {
  id: string;
  submittedBy: string;
  submitterName: string;
  submitterAvatar: string;
  match: number;
  score?: string;
  opponent?: string;
  opponentName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  decidedBy?: string;
  submittedById?: string;
}

export interface RallyAnnouncement {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: number;
}

export interface ChatRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  rallyId: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: number;
  updatedAt: number;
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


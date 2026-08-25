import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Rally } from '../types';
import { mockUsers, mockRallies } from '../data/mock';

export interface AdminUser extends User {
  email: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support' | 'verification_agent' | 'analyst' | 'user';
  status: 'active' | 'suspended' | 'banned';
  joinedAt: string;
  lastActive: string;
  isPlus: boolean;
  totalSpentOrShared: number;
  ralliesCreatedCount: number;
  ralliesJoinedCount: number;
  reportsReceivedCount: number;
  reportsSubmittedCount: number;
  trustScore: number;
}

export interface AdminRally extends Rally {
  moderationStatus: 'APPROVED' | 'PENDING' | 'FLAGGED' | 'HIDDEN' | 'REMOVED';
  reportsCount: number;
  flagReason?: string;
  moderatorNotes?: string;
  reviewedBy?: string;
}

export interface AdminReport {
  id: string;
  type: 'Suspicious Activity' | 'Spam/Bots' | 'Harassment' | 'Inappropriate Content' | 'Scam/Fraud' | 'Safety Concern' | 'Other' | string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserAvatar: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar: string;
  rallyId?: string;
  rallyTitle?: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';
  createdAt: string;
  assignedAdmin?: string;
  evidenceText?: string;
  adminNotes?: string[];
}

export interface AdminVerification {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  ninNumber: string;
  documentPhotoUrl: string;
  selfiePhotoUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  confidenceScore: number;
  assignedAdmin?: string;
  notes?: string;
  rejectionReason?: string;
}

export type AdminVerificationRequest = AdminVerification;

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  audience: 'ALL' | 'VERIFIED' | 'PLUS' | 'LOCATION' | 'SPECIFIC' | string;
  targetLocation?: string;
  targetUserId?: string;
  type: 'SYSTEM' | 'SECURITY' | 'MODERATION' | 'SAFETY' | 'COMMUNITY' | 'UPDATE' | 'MARKETING';
  sentAt: string;
  sentBy: string;
  sentCount: number;
  openRate: number;
  status: string;
  readCount: number;
  isReadByAdmin?: boolean;
}

export interface AdminAuditEntry {
  id: string;
  adminName: string;
  adminRole: string;
  action: string;
  targetType: 'USER' | 'RALLY' | 'REPORT' | 'VERIFICATION' | 'SETTINGS' | 'NOTIFICATION';
  targetId: string;
  targetName: string;
  timestamp: string;
  ipAddress: string;
  result: 'SUCCESS' | 'WARNING' | 'FAILED';
  details: string;
}

export interface AdminToast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

export interface SystemSettings {
  platformName: string;
  supportEmail: string;
  defaultRadiusKm: number;
  maxRalliesPerUser: number;
  profanityFilterEnabled: boolean;
  aiAutoFlagEnabled: boolean;
  requireNINForPaidRallies: boolean;
  autoHideReportsThreshold: number;
  supportedCities: string[];
}

interface AdminContextType {
  users: AdminUser[];
  rallies: AdminRally[];
  reports: AdminReport[];
  verifications: AdminVerification[];
  notifications: AdminNotification[];
  auditLogs: AdminAuditEntry[];
  toasts: AdminToast[];
  systemSettings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  showToast: (toastOrTitle: string | Omit<AdminToast, 'id'>, type?: AdminToast['type']) => void;
  dismissToast: (id: string) => void;
  // User Actions
  verifyUser: (userId: string) => void;
  suspendUser: (userId: string, reason: string) => void;
  banUser: (userId: string, reason: string) => void;
  unbanUser: (userId: string) => void;
  updateUserRole: (userId: string, role: AdminUser['role']) => void;
  addUser: (user: Partial<AdminUser>) => void;
  // Rally Actions
  approveRally: (rallyId: string) => void;
  hideRally: (rallyId: string, reason?: string) => void;
  removeRally: (rallyId: string, reason?: string) => void;
  flagRally: (rallyId: string, reason: string) => void;
  // Report Actions
  resolveReport: (reportId: string, resolutionNote?: string) => void;
  escalateReport: (reportId: string) => void;
  dismissReport: (reportId: string) => void;
  assignReport: (reportId: string, adminName: string) => void;
  addReportNote: (reportId: string, note: string) => void;
  // Verification Actions
  approveVerification: (verificationId: string) => void;
  rejectVerification: (verificationId: string, reason: string) => void;
  requestResubmission: (verificationId: string, note: string) => void;
  requestVerificationInfo: (verificationId: string, note: string) => void;
  // Notification Actions
  sendBroadcast: (notification: {
    title: string;
    message: string;
    audience: string;
    type: AdminNotification['type'];
    targetLocation?: string;
    targetUserId?: string;
    sentBy?: string;
  }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  // Stats
  metrics: {
    totalUsers: number;
    activeRallies: number;
    verifiedProfiles: number;
    pendingReports: number;
    pendingVerifications: number;
    todayApprovedVerifications: number;
  };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial Mock Users
  const [users, setUsers] = useState<AdminUser[]>([
    {
      id: 'alex',
      name: 'Alex Johnson',
      username: '@alexj',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
      email: 'alex.johnson@example.com',
      phone: '+234 812 345 6789',
      nin: '23491823491',
      gender: 'Male',
      location: 'Lagos',
      isNINVerified: true,
      isPhoneVerified: true,
      role: 'super_admin',
      status: 'active',
      isPlus: true,
      joinedAt: '2025-01-14',
      lastActive: 'Just now',
      badges: ['Super Admin', 'Verified Neighbor', 'Community Hero'],
      bio: 'RALLY core team & neighborhood community organizer in Lagos.',
      totalSpentOrShared: 145000,
      ralliesCreatedCount: 18,
      ralliesJoinedCount: 34,
      reportsReceivedCount: 0,
      reportsSubmittedCount: 3,
      trustScore: 99,
    },
    {
      id: 'david',
      name: 'David O.',
      username: '@davido_real',
      avatar: 'https://i.pravatar.cc/150?u=david',
      email: 'david.o@gmail.com',
      phone: '+234 803 111 2233',
      nin: '11223344556',
      gender: 'Male',
      location: 'Lagos',
      isNINVerified: true,
      isPhoneVerified: true,
      role: 'user',
      status: 'active',
      isPlus: false,
      joinedAt: '2025-02-01',
      lastActive: '12 mins ago',
      badges: ['Active Host'],
      bio: 'Tech enthusiast, music lover, and casual football player in Lekki Phase 1.',
      totalSpentOrShared: 32000,
      ralliesCreatedCount: 7,
      ralliesJoinedCount: 12,
      reportsReceivedCount: 1,
      reportsSubmittedCount: 0,
      trustScore: 92,
    },
    {
      id: 'sarah',
      name: 'Sarah M.',
      username: '@sarahm_ib',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      email: 'sarah.m@outlook.com',
      phone: '+234 901 888 7766',
      nin: '99887766554',
      gender: 'Female',
      location: 'Abuja',
      isNINVerified: true,
      isPhoneVerified: true,
      role: 'moderator',
      status: 'active',
      isPlus: true,
      joinedAt: '2025-01-20',
      lastActive: '1 hour ago',
      badges: ['Moderator', 'Verified Neighbor'],
      bio: 'Interior designer & community volunteer based in Maitama, Abuja.',
      totalSpentOrShared: 68000,
      ralliesCreatedCount: 12,
      ralliesJoinedCount: 22,
      reportsReceivedCount: 0,
      reportsSubmittedCount: 5,
      trustScore: 98,
    },
    {
      id: 'michael',
      name: 'Michael B.',
      username: '@mike_b',
      avatar: 'https://i.pravatar.cc/150?u=michael',
      email: 'michael.b@yahoo.com',
      phone: '+234 705 444 3322',
      nin: '33445566778',
      gender: 'Male',
      location: 'Lagos',
      isNINVerified: false,
      isPhoneVerified: true,
      role: 'user',
      status: 'suspended',
      isPlus: false,
      joinedAt: '2025-02-10',
      lastActive: '2 days ago',
      badges: ['Helper'],
      bio: 'Freelance mover and quick errand assistant.',
      totalSpentOrShared: 8500,
      ralliesCreatedCount: 3,
      ralliesJoinedCount: 4,
      reportsReceivedCount: 3,
      reportsSubmittedCount: 1,
      trustScore: 64,
    },
    {
      id: 'amara',
      name: 'Amara K.',
      username: '@amara_k',
      avatar: 'https://i.pravatar.cc/150?u=amara',
      email: 'amara.k@gmail.com',
      phone: '+234 818 999 0011',
      nin: '55667788990',
      gender: 'Female',
      location: 'Port Harcourt',
      isNINVerified: true,
      isPhoneVerified: true,
      role: 'user',
      status: 'active',
      isPlus: true,
      joinedAt: '2025-01-05',
      lastActive: '5 mins ago',
      badges: ['Community Hero', 'Top Host'],
      bio: 'Runner, fitness coach, and organizer of the Port Harcourt 5k weekend running club.',
      totalSpentOrShared: 92000,
      ralliesCreatedCount: 21,
      ralliesJoinedCount: 40,
      reportsReceivedCount: 0,
      reportsSubmittedCount: 0,
      trustScore: 100,
    },
    {
      id: 'fatima',
      name: 'Fatima B.',
      username: '@fatima_b',
      avatar: 'https://i.pravatar.cc/150?u=fatima',
      email: 'fatima.b@live.com',
      phone: '+234 809 333 4455',
      nin: '88776655443',
      gender: 'Female',
      location: 'Abuja',
      isNINVerified: true,
      isPhoneVerified: true,
      role: 'user',
      status: 'active',
      isPlus: false,
      joinedAt: '2025-02-14',
      lastActive: '30 mins ago',
      badges: ['Verified Neighbor'],
      bio: 'Law student in Baze University, carpooler for Airport / Gwarinpa routes.',
      totalSpentOrShared: 24000,
      ralliesCreatedCount: 5,
      ralliesJoinedCount: 9,
      reportsReceivedCount: 0,
      reportsSubmittedCount: 1,
      trustScore: 95,
    },
    {
      id: 'tunde',
      name: 'Tunde Dev',
      username: '@tunde_dev',
      avatar: 'https://i.pravatar.cc/150?u=tunde',
      email: 'tunde.ade@gmail.com',
      phone: '+234 813 555 7788',
      nin: '44332211009',
      gender: 'Male',
      location: 'Lagos',
      isNINVerified: true,
      isPhoneVerified: true,
      role: 'user',
      status: 'active',
      isPlus: false,
      joinedAt: '2025-01-28',
      lastActive: '3 hours ago',
      badges: ['Helper', 'Verified Neighbor'],
      bio: 'Software engineer & UI mentor offering free design reviews for early founders.',
      totalSpentOrShared: 15000,
      ralliesCreatedCount: 4,
      ralliesJoinedCount: 6,
      reportsReceivedCount: 0,
      reportsSubmittedCount: 0,
      trustScore: 96,
    },
    {
      id: 'emeka_spam',
      name: 'Emeka Crypto',
      username: '@crypto_profit24',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      email: 'fastcash_emeka@mail.ru',
      phone: '+234 902 000 1199',
      nin: '00000000000',
      gender: 'Male',
      location: 'Lagos',
      isNINVerified: false,
      isPhoneVerified: false,
      role: 'user',
      status: 'banned',
      isPlus: false,
      joinedAt: '2025-02-18',
      lastActive: '5 days ago',
      badges: [],
      bio: 'Guaranteed 200% ROI in 24 hours on Telegram link.',
      totalSpentOrShared: 0,
      ralliesCreatedCount: 2,
      ralliesJoinedCount: 0,
      reportsReceivedCount: 9,
      reportsSubmittedCount: 0,
      trustScore: 12,
    }
  ]);

  // Initial Rallies
  const [rallies, setRallies] = useState<AdminRally[]>([
    {
      ...mockRallies[0],
      moderationStatus: 'APPROVED',
      reportsCount: 0,
      reviewedBy: 'Sarah M.',
    },
    {
      ...mockRallies[1],
      moderationStatus: 'APPROVED',
      reportsCount: 1,
      flagReason: 'User reported high pricing inquiry',
      reviewedBy: 'Alex Johnson',
    },
    {
      ...mockRallies[2],
      moderationStatus: 'APPROVED',
      reportsCount: 0,
    },
    {
      ...mockRallies[3],
      moderationStatus: 'APPROVED',
      reportsCount: 0,
    },
    {
      ...mockRallies[4],
      moderationStatus: 'APPROVED',
      reportsCount: 0,
    },
    {
      ...mockRallies[5],
      moderationStatus: 'APPROVED',
      reportsCount: 0,
    },
    {
      ...mockRallies[6],
      moderationStatus: 'APPROVED',
      reportsCount: 0,
    },
    {
      id: 'rally-flagged-1',
      type: 'ASK',
      title: 'BUY CRYPTO SIGNALS NOW',
      description: 'Join private WhatsApp group for 10x daily crypto gains. DM now for bank account details.',
      distance: 3.5,
      city: 'Lagos',
      locationLabel: 'Lagos · Suspicious',
      time: 'Immediate',
      peopleNeeded: 50,
      peopleInterested: 0,
      isPaid: true,
      price: 15000,
      creator: {
        id: 'emeka_spam',
        name: 'Emeka Crypto',
        username: '@crypto_profit24',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
        isNINVerified: false,
        isPhoneVerified: false,
        badges: [],
      },
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      moderationStatus: 'FLAGGED',
      reportsCount: 7,
      flagReason: 'Suspected financial scam / telegram referral',
      moderatorNotes: 'Flagged automatically by spam keyword filter.',
    },
    {
      id: 'rally-pending-1',
      type: 'HELP',
      title: 'EMERGENCY CAR BATTERY JUMP',
      description: 'Stuck near Lekki Toll Gate with a dead battery. Anyone nearby with jumper cables?',
      distance: 0.8,
      city: 'Lagos',
      locationLabel: 'Lagos · 0.8 km',
      time: 'Right now',
      peopleNeeded: 1,
      peopleInterested: 2,
      isPaid: true,
      price: 5000,
      creator: mockUsers.david,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 900000).toISOString(),
      moderationStatus: 'PENDING',
      reportsCount: 0,
    }
  ]);

  // Initial Reports
  const [reports, setReports] = useState<AdminReport[]>([
    {
      id: 'REP-1092',
      type: 'Scam/Fraud',
      reportedUserId: 'emeka_spam',
      reportedUserName: 'Emeka Crypto',
      reportedUserAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      reporterId: 'david',
      reporterName: 'David O.',
      reporterAvatar: 'https://i.pravatar.cc/150?u=david',
      rallyId: 'rally-flagged-1',
      rallyTitle: 'BUY CRYPTO SIGNALS NOW',
      description: 'User is DMing people asking them to transfer money to a private OPay account for crypto signals.',
      priority: 'URGENT',
      status: 'PENDING',
      createdAt: '15 mins ago',
      assignedAdmin: 'Alex Johnson',
      evidenceText: 'Screenshot of DM asking for N15,000 transfer to an unverified bank account.',
      adminNotes: ['High confidence scam. User account has been flagged.']
    },
    {
      id: 'REP-1088',
      type: 'Suspicious Activity',
      reportedUserId: 'michael',
      reportedUserName: 'Michael B.',
      reportedUserAvatar: 'https://i.pravatar.cc/150?u=michael',
      reporterId: 'sarah',
      reporterName: 'Sarah M.',
      reporterAvatar: 'https://i.pravatar.cc/150?u=sarah',
      description: 'Accepted to help move boxes but never showed up and stopped responding after accepting.',
      priority: 'HIGH',
      status: 'UNDER_REVIEW',
      createdAt: '2 hours ago',
      assignedAdmin: 'Sarah M.',
      evidenceText: 'Chat history showing confirmed arrival time at 3:00 PM followed by 3 unanswered calls.',
      adminNotes: ['Second no-show complaint filed this week.']
    },
    {
      id: 'REP-1074',
      type: 'Spam/Bots',
      reportedUserId: 'emeka_spam',
      reportedUserName: 'Emeka Crypto',
      reportedUserAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      reporterId: 'amara',
      reporterName: 'Amara K.',
      reporterAvatar: 'https://i.pravatar.cc/150?u=amara',
      description: 'Spamming the comment feed with telegram bot links.',
      priority: 'HIGH',
      status: 'PENDING',
      createdAt: '4 hours ago',
      assignedAdmin: 'Alex Johnson',
      evidenceText: 'Repeated identical link messages posted across 4 different RALLYS.',
    },
    {
      id: 'REP-1050',
      type: 'Harassment',
      reportedUserId: 'michael',
      reportedUserName: 'Michael B.',
      reportedUserAvatar: 'https://i.pravatar.cc/150?u=michael',
      reporterId: 'fatima',
      reporterName: 'Fatima B.',
      reporterAvatar: 'https://i.pravatar.cc/150?u=fatima',
      description: 'Sent inappropriate persistent private messages after a carpool ended.',
      priority: 'URGENT',
      status: 'ESCALATED',
      createdAt: 'Yesterday · 6:30 PM',
      assignedAdmin: 'Alex Johnson',
      evidenceText: 'Direct message logs submitted by user.',
      adminNotes: ['Escalated to Trust & Safety. User temporarily suspended pending review.']
    },
    {
      id: 'REP-0994',
      type: 'Safety Concern',
      reportedUserId: 'tunde',
      reportedUserName: 'Tunde Dev',
      reportedUserAvatar: 'https://i.pravatar.cc/150?u=tunde',
      reporterId: 'david',
      reporterName: 'David O.',
      reporterAvatar: 'https://i.pravatar.cc/150?u=david',
      description: 'Clarified location details. False alarm on meetup address.',
      priority: 'LOW',
      status: 'RESOLVED',
      createdAt: '3 days ago',
      assignedAdmin: 'Sarah M.',
      adminNotes: ['Spoke with both parties. Resolved amicably.']
    }
  ]);

  // Initial Verification Requests
  const [verifications, setVerifications] = useState<AdminVerification[]>([
    {
      id: 'VER-401',
      userId: 'michael',
      userName: 'Michael B.',
      userHandle: '@mike_b',
      userAvatar: 'https://i.pravatar.cc/150?u=michael',
      ninNumber: '33445566778',
      documentPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&fit=crop',
      selfiePhotoUrl: 'https://i.pravatar.cc/150?u=michael',
      submittedAt: 'Today · 10:15 AM',
      status: 'PENDING',
      confidenceScore: 94.2,
      assignedAdmin: 'Sarah M.',
    },
    {
      id: 'VER-399',
      userId: 'sarah',
      userName: 'Sarah M.',
      userHandle: '@sarahm_ib',
      userAvatar: 'https://i.pravatar.cc/150?u=sarah',
      ninNumber: '99887766554',
      documentPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&fit=crop',
      selfiePhotoUrl: 'https://i.pravatar.cc/150?u=sarah',
      submittedAt: 'Today · 8:30 AM',
      status: 'APPROVED',
      confidenceScore: 99.1,
      assignedAdmin: 'Alex Johnson',
    },
    {
      id: 'VER-382',
      userId: 'emeka_spam',
      userName: 'Emeka Crypto',
      userHandle: '@crypto_profit24',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      ninNumber: '00000000000',
      documentPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&fit=crop',
      selfiePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      submittedAt: 'Yesterday · 4:00 PM',
      status: 'REJECTED',
      confidenceScore: 23.0,
      assignedAdmin: 'Alex Johnson',
      notes: 'Fake identity card with mismatched DOB and fraudulent NIN.',
      rejectionReason: 'Fake document / NIN mismatch',
    }
  ]);

  // Initial Notifications
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: 'NOTIF-1',
      title: 'Weekend Safety Advisory in Lekki & VI',
      message: 'Always verify meetups in well-lit public spots and check for the NIN Verified badge.',
      audience: 'Location: Lagos',
      targetLocation: 'Lagos',
      type: 'SAFETY',
      sentAt: '2 hours ago',
      sentBy: 'Alex Johnson',
      sentCount: 1420,
      openRate: 68.4,
      status: 'DELIVERED',
      readCount: 1420,
      isReadByAdmin: true,
    },
    {
      id: 'NOTIF-2',
      title: 'Welcome to RALLY+ Early Access',
      message: 'Unlock infinite search radius, verified host priority, and zero transaction fees.',
      audience: 'PLUS',
      type: 'COMMUNITY',
      sentAt: '1 day ago',
      sentBy: 'Sarah M.',
      sentCount: 890,
      openRate: 81.2,
      status: 'DELIVERED',
      readCount: 720,
      isReadByAdmin: true,
    },
    {
      id: 'NOTIF-3',
      title: 'Platform Maintenance Notice',
      message: 'Scheduled 10-minute database optimization tonight at 3:00 AM WAT.',
      audience: 'ALL',
      type: 'SYSTEM',
      sentAt: '2 days ago',
      sentBy: 'Alex Johnson',
      sentCount: 12482,
      openRate: 49.6,
      status: 'DELIVERED',
      readCount: 6200,
      isReadByAdmin: false,
    }
  ]);

  // Initial Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([
    {
      id: 'AUD-8801',
      adminName: 'Alex Johnson',
      adminRole: 'Super Admin',
      action: 'Banned Fraudulent User',
      targetType: 'USER',
      targetId: 'emeka_spam',
      targetName: 'Emeka Crypto (@crypto_profit24)',
      timestamp: 'Today · 12:45 PM',
      ipAddress: '102.89.23.11 (Lagos, NG)',
      result: 'SUCCESS',
      details: 'Permanently banned user following 9 confirmed spam and scam reports.',
    },
    {
      id: 'AUD-8800',
      adminName: 'Alex Johnson',
      adminRole: 'Super Admin',
      action: 'Approved NIN Identity Verification',
      targetType: 'VERIFICATION',
      targetId: 'VER-399',
      targetName: 'Sarah M. (@sarahm_ib)',
      timestamp: 'Today · 8:35 AM',
      ipAddress: '102.89.23.11 (Lagos, NG)',
      result: 'SUCCESS',
      details: 'Verified national ID match score 99.1%. Activated Verified Neighbor badge.',
    },
    {
      id: 'AUD-8799',
      adminName: 'Sarah M.',
      adminRole: 'Moderator',
      action: 'Flagged RALLY Post',
      targetType: 'RALLY',
      targetId: 'rally-flagged-1',
      targetName: 'BUY CRYPTO SIGNALS NOW',
      timestamp: 'Today · 7:15 AM',
      ipAddress: '197.210.64.92 (Abuja, NG)',
      result: 'WARNING',
      details: 'Flagged post for financial spam keyword triggers.',
    },
    {
      id: 'AUD-8798',
      adminName: 'Alex Johnson',
      adminRole: 'Super Admin',
      action: 'Updated System Radius Settings',
      targetType: 'SETTINGS',
      targetId: 'CFG-RADIUS',
      targetName: 'Discovery Engine',
      timestamp: 'Yesterday · 4:20 PM',
      ipAddress: '102.89.23.11 (Lagos, NG)',
      result: 'SUCCESS',
      details: 'Expanded default discovery radius from 3.0km to 5.0km for Port Harcourt region.',
    }
  ]);

  // System Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    platformName: 'RALLY',
    supportEmail: 'safety@rallyapp.ng',
    defaultRadiusKm: 5,
    maxRalliesPerUser: 10,
    profanityFilterEnabled: true,
    aiAutoFlagEnabled: true,
    requireNINForPaidRallies: true,
    autoHideReportsThreshold: 3,
    supportedCities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Enugu', 'Benin City', 'Kano'],
  });

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({ ...prev, ...newSettings }));
    logAudit({
      action: 'Updated System Configuration',
      targetType: 'SETTINGS',
      targetId: 'SYS-CFG',
      targetName: 'System Settings',
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: 'Admin modified core platform and moderation parameters.'
    });
  };

  // Toast notifications state
  const [toasts, setToasts] = useState<AdminToast[]>([]);

  const showToast = (toastOrTitle: string | Omit<AdminToast, 'id'>, type?: AdminToast['type']) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    if (typeof toastOrTitle === 'string') {
      setToasts(prev => [...prev, { id, title: toastOrTitle, type: type || 'info' }]);
    } else {
      setToasts(prev => [...prev, { ...toastOrTitle, id }]);
    }
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Helper log audit
  const logAudit = (entry: Omit<AdminAuditEntry, 'id' | 'timestamp' | 'adminName' | 'adminRole'>) => {
    const newEntry: AdminAuditEntry = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      adminName: 'Alex Johnson',
      adminRole: 'Super Admin',
      timestamp: 'Just now',
      ...entry,
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  // User Actions
  const verifyUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isNINVerified: true, badges: Array.from(new Set([...u.badges, 'Verified Neighbor'])) } : u));
    logAudit({
      action: 'Manually Verified User NIN',
      targetType: 'USER',
      targetId: userId,
      targetName: users.find(u => u.id === userId)?.name || userId,
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: 'Admin manually granted NIN verification status.'
    });
    showToast({
      title: 'User Verified',
      message: `User ${userId} has been verified with NIN badge.`,
      type: 'success'
    });
  };

  const suspendUser = (userId: string, reason: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'suspended' } : u));
    logAudit({
      action: 'Suspended User Account',
      targetType: 'USER',
      targetId: userId,
      targetName: users.find(u => u.id === userId)?.name || userId,
      ipAddress: '102.89.23.11',
      result: 'WARNING',
      details: `Suspended account: ${reason}`
    });
    showToast({
      title: 'Account Suspended',
      message: `User has been suspended. Reason: ${reason}`,
      type: 'warning'
    });
  };

  const banUser = (userId: string, reason: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' } : u));
    logAudit({
      action: 'Banned User Account',
      targetType: 'USER',
      targetId: userId,
      targetName: users.find(u => u.id === userId)?.name || userId,
      ipAddress: '102.89.23.11',
      result: 'FAILED',
      details: `Permanently banned account: ${reason}`
    });
    showToast({
      title: 'Account Banned',
      message: `User has been banned permanently.`,
      type: 'danger'
    });
  };

  const unbanUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
    logAudit({
      action: 'Restored User Account',
      targetType: 'USER',
      targetId: userId,
      targetName: users.find(u => u.id === userId)?.name || userId,
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: 'Restored suspended/banned account to active status.'
    });
    showToast({
      title: 'Account Restored',
      message: `User status set to Active.`,
      type: 'success'
    });
  };

  const updateUserRole = (userId: string, role: AdminUser['role']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    logAudit({
      action: 'Updated User Role',
      targetType: 'USER',
      targetId: userId,
      targetName: users.find(u => u.id === userId)?.name || userId,
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: `Changed role to ${role.toUpperCase()}`
    });
    showToast({
      title: 'Role Updated',
      message: `User role changed to ${role}.`,
      type: 'success'
    });
  };

  const addUser = (newUser: Partial<AdminUser>) => {
    const id = `user-${Date.now()}`;
    const userToAdd: AdminUser = {
      id,
      name: newUser.name || 'New User',
      username: newUser.username || `@user_${id.substr(5, 4)}`,
      avatar: newUser.avatar || 'https://i.pravatar.cc/150',
      email: newUser.email || 'user@example.com',
      phone: newUser.phone || '+234 800 000 0000',
      nin: newUser.nin || '00000000000',
      gender: newUser.gender || 'Other',
      location: newUser.location || 'Lagos',
      isNINVerified: newUser.isNINVerified || false,
      isPhoneVerified: true,
      role: newUser.role || 'user',
      status: newUser.status || 'active',
      isPlus: newUser.isPlus || false,
      joinedAt: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      badges: newUser.isNINVerified ? ['Verified Neighbor'] : [],
      bio: newUser.bio || 'New member of the RALLY community.',
      totalSpentOrShared: 0,
      ralliesCreatedCount: 0,
      ralliesJoinedCount: 0,
      reportsReceivedCount: 0,
      reportsSubmittedCount: 0,
      trustScore: 80,
    };
    setUsers(prev => [userToAdd, ...prev]);
    logAudit({
      action: 'Created / Invited User',
      targetType: 'USER',
      targetId: id,
      targetName: userToAdd.name,
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: `Created new user profile with role: ${userToAdd.role}`
    });
    showToast({
      title: 'User Added',
      message: `User ${userToAdd.name} has been added successfully.`,
      type: 'success'
    });
  };

  // Rally Actions
  const approveRally = (rallyId: string) => {
    setRallies(prev => prev.map(r => r.id === rallyId ? { ...r, moderationStatus: 'APPROVED' } : r));
    logAudit({
      action: 'Approved RALLY Content',
      targetType: 'RALLY',
      targetId: rallyId,
      targetName: rallies.find(r => r.id === rallyId)?.title || rallyId,
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: 'Reviewed and approved post content.'
    });
    showToast({
      title: 'RALLY Approved',
      message: 'Post is now publicly visible on the active feed.',
      type: 'success'
    });
  };

  const hideRally = (rallyId: string, reason = 'Temporarily hidden by moderation') => {
    setRallies(prev => prev.map(r => r.id === rallyId ? { ...r, moderationStatus: 'HIDDEN', flagReason: reason } : r));
    logAudit({
      action: 'Hidden RALLY Content',
      targetType: 'RALLY',
      targetId: rallyId,
      targetName: rallies.find(r => r.id === rallyId)?.title || rallyId,
      ipAddress: '102.89.23.11',
      result: 'WARNING',
      details: `Post hidden: ${reason}`
    });
    showToast({
      title: 'RALLY Hidden',
      message: 'Post has been hidden from public feed.',
      type: 'warning'
    });
  };

  const removeRally = (rallyId: string, reason = 'Violates community guidelines') => {
    setRallies(prev => prev.map(r => r.id === rallyId ? { ...r, moderationStatus: 'REMOVED', flagReason: reason } : r));
    logAudit({
      action: 'Removed RALLY Post',
      targetType: 'RALLY',
      targetId: rallyId,
      targetName: rallies.find(r => r.id === rallyId)?.title || rallyId,
      ipAddress: '102.89.23.11',
      result: 'FAILED',
      details: `Removed post: ${reason}`
    });
    showToast({
      title: 'RALLY Removed',
      message: 'Post permanently removed from feed.',
      type: 'danger'
    });
  };

  const flagRally = (rallyId: string, reason: string) => {
    setRallies(prev => prev.map(r => r.id === rallyId ? { ...r, moderationStatus: 'FLAGGED', flagReason: reason } : r));
    logAudit({
      action: 'Flagged RALLY Post',
      targetType: 'RALLY',
      targetId: rallyId,
      targetName: rallies.find(r => r.id === rallyId)?.title || rallyId,
      ipAddress: '102.89.23.11',
      result: 'WARNING',
      details: `Flagged for investigation: ${reason}`
    });
    showToast({
      title: 'RALLY Flagged',
      message: 'Post flagged for admin investigation.',
      type: 'warning'
    });
  };

  // Report Actions
  const resolveReport = (reportId: string, resolutionNote?: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      status: 'RESOLVED',
      adminNotes: resolutionNote ? [...(r.adminNotes || []), `Resolved: ${resolutionNote}`] : r.adminNotes
    } : r));
    logAudit({
      action: 'Resolved Safety Report',
      targetType: 'REPORT',
      targetId: reportId,
      targetName: reportId,
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: resolutionNote || 'Report marked resolved by admin.'
    });
    showToast({
      title: 'Report Resolved',
      message: `Report ${reportId} marked as resolved.`,
      type: 'success'
    });
  };

  const escalateReport = (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'ESCALATED', priority: 'URGENT' } : r));
    logAudit({
      action: 'Escalated Report to Super Admin',
      targetType: 'REPORT',
      targetId: reportId,
      targetName: reportId,
      ipAddress: '102.89.23.11',
      result: 'WARNING',
      details: 'Escalated priority to Urgent for immediate intervention.'
    });
    showToast({
      title: 'Report Escalated',
      message: `Report ${reportId} escalated to Super Admin queue.`,
      type: 'warning'
    });
  };

  const dismissReport = (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'DISMISSED' } : r));
    logAudit({
      action: 'Dismissed Report',
      targetType: 'REPORT',
      targetId: reportId,
      targetName: reportId,
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: 'Report dismissed as false alarm / duplicate.'
    });
    showToast({
      title: 'Report Dismissed',
      message: `Report ${reportId} dismissed.`,
      type: 'info'
    });
  };

  const assignReport = (reportId: string, adminName: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, assignedAdmin: adminName, status: 'UNDER_REVIEW' } : r));
    logAudit({
      action: 'Assigned Report',
      targetType: 'REPORT',
      targetId: reportId,
      targetName: reportId,
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: `Assigned investigation to ${adminName}`
    });
    showToast({
      title: 'Report Assigned',
      message: `Assigned to ${adminName}.`,
      type: 'info'
    });
  };

  const addReportNote = (reportId: string, note: string) => {
    const timestampedNote = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${note}`;
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      adminNotes: [...(r.adminNotes || []), timestampedNote]
    } : r));
    showToast({
      title: 'Note Added',
      message: 'Investigation log updated.',
      type: 'info'
    });
  };

  // Verification Actions
  const approveVerification = (verificationId: string) => {
    const req = verifications.find(v => v.id === verificationId);
    setVerifications(prev => prev.map(v => v.id === verificationId ? { ...v, status: 'APPROVED' } : v));
    if (req) {
      setUsers(prev => prev.map(u => u.id === req.userId ? { ...u, isNINVerified: true, badges: Array.from(new Set([...u.badges, 'Verified Neighbor'])) } : u));
    }
    logAudit({
      action: 'Approved Identity Verification',
      targetType: 'VERIFICATION',
      targetId: verificationId,
      targetName: req?.userName || verificationId,
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: `Approved verification request ${verificationId}. Added Verified Neighbor badge.`
    });
    showToast({
      title: 'Verification Approved',
      message: `NIN Verified badge activated for ${req?.userName || 'user'}.`,
      type: 'success'
    });
  };

  const rejectVerification = (verificationId: string, reason: string) => {
    const req = verifications.find(v => v.id === verificationId);
    setVerifications(prev => prev.map(v => v.id === verificationId ? { ...v, status: 'REJECTED', notes: reason, rejectionReason: reason } : v));
    logAudit({
      action: 'Rejected Identity Verification',
      targetType: 'VERIFICATION',
      targetId: verificationId,
      targetName: req?.userName || verificationId,
      ipAddress: '102.89.23.11',
      result: 'FAILED',
      details: `Rejected verification: ${reason}`
    });
    showToast({
      title: 'Verification Rejected',
      message: `Request rejected. Reason: ${reason}`,
      type: 'danger'
    });
  };

  const requestResubmission = (verificationId: string, note: string) => {
    setVerifications(prev => prev.map(v => v.id === verificationId ? { ...v, status: 'INFO_REQUESTED', notes: note } : v));
    showToast({
      title: 'More Information Requested',
      message: 'User notified to upload clearer document photo.',
      type: 'info'
    });
  };

  const requestVerificationInfo = (verificationId: string, note: string) => {
    requestResubmission(verificationId, note);
  };

  // Notification Actions
  const sendBroadcast = (notif: {
    title: string;
    message: string;
    audience: string;
    type: AdminNotification['type'];
    targetLocation?: string;
    targetUserId?: string;
    sentBy?: string;
  }) => {
    const newNotif: AdminNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      title: notif.title,
      message: notif.message,
      audience: notif.audience,
      targetLocation: notif.targetLocation,
      targetUserId: notif.targetUserId,
      type: notif.type,
      sentAt: 'Just now',
      sentBy: notif.sentBy || 'Alex Johnson',
      sentCount: notif.audience === 'ALL' ? 12482 : notif.audience === 'VERIFIED' ? 8291 : 1420,
      openRate: 0,
      status: 'DELIVERED',
      readCount: 0,
      isReadByAdmin: true,
    };
    setNotifications(prev => [newNotif, ...prev]);
    logAudit({
      action: 'Sent Platform Broadcast',
      targetType: 'NOTIFICATION',
      targetId: newNotif.id,
      targetName: newNotif.title,
      ipAddress: '102.89.23.11',
      result: 'SUCCESS',
      details: `Audience: ${notif.audience} ${notif.targetLocation ? `(${notif.targetLocation})` : ''}`
    });
    showToast({
      title: 'Broadcast Dispatched',
      message: `Notification sent to target audience (${notif.audience}).`,
      type: 'success'
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isReadByAdmin: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isReadByAdmin: true })));
    showToast({
      title: 'All Read',
      message: 'Marked all admin alerts as read.',
      type: 'info'
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast({
      title: 'Notification Deleted',
      message: 'Alert removed from system history.',
      type: 'info'
    });
  };

  // Metrics calculation
  const metrics = {
    totalUsers: users.length + 12474,
    activeRallies: rallies.filter(r => r.moderationStatus === 'APPROVED').length + 1835,
    verifiedProfiles: users.filter(u => u.isNINVerified).length + 8284,
    pendingReports: reports.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length + 10,
    pendingVerifications: verifications.filter(v => v.status === 'PENDING').length + 6,
    todayApprovedVerifications: 14,
  };

  return (
    <AdminContext.Provider value={{
      users,
      rallies,
      reports,
      verifications,
      notifications,
      auditLogs,
      toasts,
      systemSettings,
      updateSettings,
      showToast,
      dismissToast,
      verifyUser,
      suspendUser,
      banUser,
      unbanUser,
      updateUserRole,
      addUser,
      approveRally,
      hideRally,
      removeRally,
      flagRally,
      resolveReport,
      escalateReport,
      dismissReport,
      assignReport,
      addReportNote,
      approveVerification,
      rejectVerification,
      requestResubmission,
      requestVerificationInfo,
      sendBroadcast,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      metrics,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

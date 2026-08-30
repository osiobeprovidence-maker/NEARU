import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Users,
  MapPin,
  Bell,
  CheckCheck,
  MessageCircle,
  UserPlus,
  Calendar,
  Trophy,
  ShieldCheck,
  XCircle,
  Megaphone,
  X,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';

const NOTIF_ICONS: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  rally_nearby: { icon: MapPin, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  interest: { icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
  responses: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  reminder: { icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
  new_message: { icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  message_request: { icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  message_request_accepted: { icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  rally_participant_joined: { icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  rally_participant_left: { icon: Users, color: 'text-zinc-500', bg: 'bg-zinc-100' },
  event_participant_joined: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  result_submitted: { icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
  result_approved: { icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  result_rejected: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  event_update: { icon: Megaphone, color: 'text-violet-600', bg: 'bg-violet-50' },
  event_status: { icon: ShieldCheck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { convexUserId } = useAuth();
  const navigate = useNavigate();

  const notifications = useQuery(
    api.notifications.listByUser,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const handleNotifClick = async (notif: any) => {
    if (!notif.read) {
      await markAsRead({ notificationId: notif._id });
    }
    if (
      notif.type === 'new_message' ||
      notif.type === 'rally_participant_joined' ||
      notif.type === 'rally_participant_left'
    ) {
      navigate('/messages', { state: { tab: 'conversations' } });
      onClose();
      return;
    }
    if (notif.type === 'message_request' || notif.type === 'message_request_accepted') {
      navigate('/messages', { state: { tab: 'requests' } });
      onClose();
      return;
    }
    const eventTypes = [
      'event_participant_joined',
      'result_submitted',
      'result_approved',
      'result_rejected',
      'event_update',
      'event_status',
    ];
    if (eventTypes.includes(notif.type) && notif.rallyId) {
      navigate(`/rally/${notif.rallyId}`);
      onClose();
      return;
    }
    if (notif.rallyId) {
      navigate('/explore');
      onClose();
      return;
    }
    onClose();
  };

  const notifList = notifications ?? [];
  const hasUnread = notifList.some((n) => !n.read);

  const handleMarkAllRead = async () => {
    if (convexUserId) await markAllAsRead({ userId: convexUserId as any });
  };

  const goToAll = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-zinc-900/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="fixed left-0 right-0 z-[45] top-header-offset max-h-[72vh] bg-white border-b border-zinc-200 shadow-xl rounded-b-3xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-zinc-100 shrink-0">
              <h2 className="text-base font-black text-zinc-900">Notifications</h2>
              <div className="flex items-center gap-1.5">
                {hasUnread && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 transition-all text-xs font-bold active:scale-95"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors active:scale-95"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications === undefined ? (
                <div className="p-8 text-center text-xs text-zinc-400">Loading…</div>
              ) : notifList.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900">All caught up!</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    You don't have any notifications right now.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {notifList.map((notif: any) => {
                    const iconConfig = NOTIF_ICONS[notif.type] || NOTIF_ICONS.rally_nearby;
                    const Icon = iconConfig.icon;
                    return (
                      <button
                        key={notif._id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left px-4 py-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                          notif.read ? 'bg-zinc-50/40 hover:bg-zinc-50/80' : 'bg-white hover:bg-zinc-50/80'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-zinc-200/60 ${iconConfig.bg} ${iconConfig.color}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm truncate ${
                                notif.read ? 'font-semibold text-zinc-600' : 'font-bold text-zinc-900'
                              }`}
                            >
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2 mt-0.5">
                            {notif.body}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-medium mt-1">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={goToAll}
              className="shrink-0 w-full px-4 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors border-t border-zinc-100"
            >
              View all notifications
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import PageShell from '../components/PageShell';
import { Heart, Users, MapPin, Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NOTIF_ICONS: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  rally_nearby: { icon: MapPin, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  interest: { icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
  responses: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  reminder: { icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
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

export default function Notifications() {
  const { convexUserId } = useAuth();
  const navigate = useNavigate();
  const notifications = useQuery(
    api.notifications.listByUser,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const clearAll = useMutation(api.notifications.clearAll);

  const handleMarkAllRead = async () => {
    if (convexUserId) await markAllAsRead({ userId: convexUserId as any });
  };

  const handleClearAll = async () => {
    if (convexUserId) await clearAll({ userId: convexUserId as any });
  };

  const handleNotifClick = async (notif: any) => {
    if (!notif.read) {
      await markAsRead({ notificationId: notif._id });
    }
    if (notif.rallyId) {
      navigate('/explore');
    }
  };

  const notifList = notifications ?? [];
  const hasUnread = notifList.some((n) => !n.read);

  const headerAction = (
    <div className="flex items-center gap-2">
      {notifList.length > 0 && hasUnread && (
        <button 
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 transition-all text-xs font-bold active:scale-95"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mark read</span>
        </button>
      )}
      {notifList.length > 0 && (
        <button 
          onClick={handleClearAll}
          className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all text-xs font-bold active:scale-95"
        >
          Clear
        </button>
      )}
    </div>
  );

  if (notifications === undefined) {
    return (
      <PageShell title="Notifications" headerAction={headerAction}>
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Bell className="w-8 h-8 text-zinc-300" />
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Notifications" headerAction={headerAction}>
      {notifList.length === 0 ? (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900">All caught up!</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            You don't have any notifications right now. When someone rallies near you, you'll see it here.
          </p>
        </div>
      ) : (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
          {notifList.map((notif) => {
            const iconConfig = NOTIF_ICONS[notif.type] || NOTIF_ICONS.rally_nearby;
            const Icon = iconConfig.icon;
            return (
              <motion.div 
                key={notif._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleNotifClick(notif)}
                className={`p-5 sm:p-6 transition-colors flex items-start sm:items-center justify-between gap-4 cursor-pointer group ${
                  notif.read ? 'bg-zinc-50/40 hover:bg-zinc-50/80 opacity-80' : 'bg-white hover:bg-zinc-50/80'
                }`}
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-200/60 shadow-xs ${iconConfig.bg} ${iconConfig.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={`text-sm truncate group-hover:text-black transition-colors ${
                        notif.read ? 'font-semibold text-zinc-700' : 'font-bold text-zinc-900'
                      }`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-medium mt-1">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

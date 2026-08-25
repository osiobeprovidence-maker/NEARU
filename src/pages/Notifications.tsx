import React, { useState } from 'react';
import { motion } from 'motion/react';
import PageShell from '../components/PageShell';
import { Heart, Users, Clock, CheckCheck, Bell } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      icon: Heart,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
      title: 'David is interested in your RALLY',
      subtitle: 'Extra rave ticket',
      time: '2 minutes ago',
      unread: true,
      type: 'interest'
    },
    {
      id: 2,
      icon: Users,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      title: 'Your RALLY has 5 new responses',
      subtitle: 'Need help moving',
      time: '10 minutes ago',
      unread: true,
      type: 'responses'
    },
    {
      id: 3,
      icon: Clock,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      title: 'Your RALLY starts in 1 hour',
      subtitle: 'Football tonight',
      time: '50 minutes ago',
      unread: false,
      type: 'reminder'
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const headerAction = (
    <div className="flex items-center gap-2">
      {notifications.length > 0 && (
        <>
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 transition-all text-xs font-bold active:scale-95"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mark read</span>
          </button>
          <button 
            onClick={clearAll}
            className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all text-xs font-bold active:scale-95"
          >
            Clear
          </button>
        </>
      )}
    </div>
  );

  return (
    <PageShell title="Notifications" headerAction={headerAction}>
      {notifications.length === 0 ? (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900">All caught up!</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            You don't have any unread notifications right now. Check back later for activity updates.
          </p>
        </div>
      ) : (
        <div className="bg-white md:rounded-[2rem] border-y md:border border-zinc-200 shadow-sm shadow-zinc-200/50 overflow-hidden divide-y divide-zinc-100">
          {notifications.map(notif => {
            const Icon = notif.icon;
            return (
              <motion.div 
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 sm:p-6 transition-colors flex items-start sm:items-center justify-between gap-4 cursor-pointer group ${
                  notif.unread ? 'bg-white hover:bg-zinc-50/80' : 'bg-zinc-50/40 hover:bg-zinc-50/80 opacity-80'
                }`}
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-200/60 shadow-xs ${notif.iconBg} ${notif.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={`text-base truncate group-hover:text-black transition-colors ${
                        notif.unread ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-700'
                      }`}>
                        {notif.title}
                      </h4>
                      {notif.unread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5 truncate">
                      {notif.subtitle}
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">
                      {notif.time}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
                    {notif.type}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

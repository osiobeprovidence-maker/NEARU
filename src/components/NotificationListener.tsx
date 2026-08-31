import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import { playNotificationSound } from '../lib/notificationSound';
import Avatar from './Avatar';

/**
 * Handles the "immediate" real-time layer of message notifications:
 *  - a dedicated in-app toast (sender avatar + name + preview + View action)
 *  - an optional notification chime (respects `soundEnabled`)
 *  - an optional browser Notification (respects `pushEnabled`), click navigates
 *
 * Both the conversation list and the incoming-request list are already watched
 * reactively by Convex, so new messages/requests are pushed here instantly.
 * To avoid a burst of popups on first load, the first snapshot only seeds the
 * dedupe bookkeeping; only *new* messages/requests fire alerts.
 */
export default function NotificationListener({
  conversations,
}: {
  conversations: any[] | undefined;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, convexUserId } = useAuth();
  const incomingRequests = useQuery(
    api.chatRequests.listByUser,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );

  const [toasts, setToasts] = useState<
    { key: string; name: string; avatar: string; title: string; body: string; url: string; rally: boolean }[]
  >([]);

  // Latest navigator so browser-notification clicks can route without reload.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Dedupe bookkeeping: conversationId -> lastMessage.timestamp handled.
  const seenConvRef = useRef<Record<string, number>>({});
  // Dedupe: requestId -> createdAt handled.
  const seenReqRef = useRef<Record<string, number>>({});
  const convHydratedRef = useRef(false);
  const reqHydratedRef = useRef(false);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const settings = user.notificationSettings || {
    pushEnabled: true,
    chatMessages: true,
    soundEnabled: true,
    vibrationEnabled: true,
  };

  const isLoggedIn = !!convexUserId;

  const pushToast = useCallback(
    (t: {
      name: string;
      avatar: string;
      title: string;
      body: string;
      url: string;
      rally: boolean;
    }) => {
      const key = `${t.url}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { ...t, key }]);
      timersRef.current[key] = setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.key !== key));
        delete timersRef.current[key];
      }, 5500);

      if (settings.soundEnabled) playNotificationSound();

      if (
        settings.pushEnabled &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          const notif = new Notification(t.title, {
            body: t.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: t.url,
            data: { url: t.url },
          });
          notif.onclick = () => {
            window.focus();
            navigateRef.current(t.url);
            notif.close();
          };
        } catch {
          /* best-effort */
        }
      }
    },
    [settings.pushEnabled, settings.soundEnabled]
  );

  // Fire alert for a newly-unread incoming message in a conversation.
  const fireMessage = useCallback(
    (conv: any) => {
      const url = `/messages/${conv._id}`;
      const isRally = conv.type === 'rally' || conv.isDirect === false;
      const last = conv.lastMessage || {};
      const name = isRally
        ? conv.rallyTitle || 'RALLY chat'
        : conv.otherParticipant?.name || 'New message';
      const avatar = conv.otherParticipant?.avatar || '';
      const body = isRally
        ? `${conv.otherParticipant?.name || 'Someone'}: ${last.text || ''}`
        : (last.text || '');
      pushToast({
        name,
        avatar,
        title: isRally ? 'New message in RALLY chat' : 'New message',
        body,
        url,
        rally: isRally,
      });
    },
    [pushToast]
  );

  // Watch conversations for newly-unread messages.
  useEffect(() => {
    if (!conversations || !isLoggedIn) return;

    if (!convHydratedRef.current) {
      // First snapshot: seed with current state, do not fire anything.
      for (const c of conversations) {
        const last = c.lastMessage;
        if (last && last.senderId !== convexUserId) {
          seenConvRef.current[c._id] = last.timestamp;
        }
      }
      convHydratedRef.current = true;
      return;
    }

    const currentPath = location.pathname;
    for (const c of conversations) {
      const myUnread = c.myUnread ?? 0;
      const last = c.lastMessage;
      if (!last || myUnread <= 0) continue;
      // Ignore my own messages.
      if (last.senderId === convexUserId) continue;
      // Suppress when the user is already reading this conversation.
      if (currentPath === `/messages/${c._id}`) continue;
      const seenTs = seenConvRef.current[c._id];
      if (seenTs !== last.timestamp) {
        fireMessage(c);
      }
      seenConvRef.current[c._id] = last.timestamp;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, location.pathname, isLoggedIn, convexUserId]);

  // Watch for new incoming message requests.
  useEffect(() => {
    const reqs = (incomingRequests ?? []).filter((r: any) => r.status === 'PENDING');
    if (!convexUserId) return;

    if (!reqHydratedRef.current) {
      for (const r of reqs) seenReqRef.current[r._id] = r.createdAt;
      reqHydratedRef.current = true;
      return;
    }

    for (const r of reqs) {
      if (seenReqRef.current[r._id] === undefined || seenReqRef.current[r._id] !== r.createdAt) {
        const name = r.sender?.name || 'Someone';
        pushToast({
          name,
          avatar: r.sender?.avatar || '',
          title: 'New message request',
          body: `${name} wants to message you: "${r.message || ''}"`,
          url: '/messages',
          rally: false,
        });
      }
      seenReqRef.current[r._id] = r.createdAt;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingRequests, convexUserId]);

  // Cleanup timers on unmount.
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  if (!isLoggedIn) return null;

  return (
    <>
      <div className="fixed z-[110] top-4 right-4 left-4 sm:left-auto sm:w-[360px] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.button
              key={t.key}
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={() => {
                setToasts((prev) => prev.filter((x) => x.key !== t.key));
                navigate(t.url);
              }}
              className="pointer-events-auto w-full text-left flex items-start gap-3 bg-zinc-900/95 text-white backdrop-blur px-3.5 py-3 rounded-2xl shadow-xl border border-white/10"
            >
              <div className="shrink-0 mt-0.5">
                <Avatar src={t.avatar} name={t.name} size="md" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black truncate">{t.title}</p>
                <p className="text-xs text-zinc-300 font-semibold truncate">{t.name}</p>
                <p className="text-xs text-zinc-400 leading-snug mt-0.5 line-clamp-2">{t.body}</p>
              </div>
              <span className="shrink-0 self-center text-[11px] font-bold text-indigo-300">
                View
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

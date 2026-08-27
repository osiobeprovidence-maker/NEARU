import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationListener() {
  const { convexUserId } = useAuth();
  const notifications = useQuery(
    api.notifications.listByUser,
    convexUserId ? { userId: convexUserId as any } : 'skip'
  );
  const lastCountRef = useRef(0);

  useEffect(() => {
    if (!notifications) return;
    const unreadCount = notifications.filter((n) => !n.read).length;
    
    if (unreadCount > lastCountRef.current && lastCountRef.current > 0) {
      const latest = notifications.find((n) => !n.read);
      if (latest) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            title: latest.title,
            subtitle: latest.body,
          }
        }));

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(latest.title, {
              body: latest.body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: latest._id,
            });
          } catch {}
        }
      }
    }
    
    lastCountRef.current = unreadCount;
  }, [notifications]);

  return null;
}

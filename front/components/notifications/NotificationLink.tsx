'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { connectNotificationsSSE } from '@/lib/sse';

export function NotificationLink() {
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    const disconnect = connectNotificationsSSE(token, (event) => {
      if (event.type === 'init') {
        setUnreadCount(event.notifications.filter((n) => !n.read).length);
      } else if (event.type === 'new') {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return disconnect;
  }, [token]);

  return (
    <Link href="/notifications">
      Notifications{unreadCount > 0 && ` (${unreadCount})`}
    </Link>
  );
}

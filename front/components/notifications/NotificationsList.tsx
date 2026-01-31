'use client';

import { useState, useEffect } from 'react';
import { Notification } from '@/lib/auth/types';
import { connectNotificationsSSE } from '@/lib/sse';
import Link from 'next/link';

type Props = {
  token: string;
};

export function NotificationsList({ token }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const disconnect = connectNotificationsSSE(token, (event) => {
      if (event.type === 'init') {
        setNotifications(event.notifications);
        setLoading(false);
      } else if (event.type === 'new') {
        setNotifications((prev) => [event.notification, ...prev]);
      }
    });

    return disconnect;
  }, [token]);

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (notifications.length === 0) {
    return <p>Aucune notification.</p>;
  }

  return (
    <ul className="space-y-2">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className={`p-3 border rounded ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
        >
          <Link href={`/notifications/${notification.id}`} className="block">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className={notification.read ? 'text-gray-600' : 'font-semibold'}>
                  {notification.content}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              {!notification.read && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Nouveau
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

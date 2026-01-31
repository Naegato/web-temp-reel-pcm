'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/lib/auth/types';
import { deleteNotification } from '@/lib/api-client/actions';
import Link from 'next/link';

type Props = {
  notification: Notification;
};

export function NotificationDetail({ notification }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Supprimer cette notification ?')) return;

    setDeleting(true);
    const result = await deleteNotification(notification.id);

    if ('error' in result) {
      alert('Erreur lors de la suppression');
      setDeleting(false);
      return;
    }

    router.push('/notifications');
  };

  return (
    <div>
      <div className="mb-4">
        <Link href="/notifications" className="text-blue-500 hover:underline">
          &larr; Retour aux notifications
        </Link>
      </div>

      <div className="border rounded p-4">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-xl font-bold">Notification</h1>
          <span className={`text-xs px-2 py-1 rounded ${notification.read ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}>
            {notification.read ? 'Lu' : 'Non lu'}
          </span>
        </div>

        <p className="mb-4">{notification.content}</p>

        <p className="text-sm text-gray-500 mb-4">
          {new Date(notification.createdAt).toLocaleString('fr-FR')}
        </p>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
        >
          {deleting ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </div>
  );
}

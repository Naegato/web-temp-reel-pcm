'use client';

import { useState } from 'react';
import { Client } from '@/lib/auth/types';
import { createNotification } from '@/lib/api-client/actions';

type Props = {
  clients: Client[];
};

export function CreateNotificationForm({ clients }: Props) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !content.trim()) return;

    setSending(true);
    setMessage(null);

    const result = await createNotification(selectedUserId, content);

    if ('error' in result) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Notification envoyée' });
      setContent('');
    }

    setSending(false);
  };

  if (clients.length === 0) {
    return <p className="text-gray-500">Aucun client à notifier.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Client</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">Sélectionner un client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
          placeholder="Contenu de la notification..."
          required
        />
      </div>

      {message && (
        <p className={message.type === 'error' ? 'text-red-500' : 'text-green-500'}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={sending || !selectedUserId || !content.trim()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {sending ? 'Envoi...' : 'Envoyer'}
      </button>
    </form>
  );
}

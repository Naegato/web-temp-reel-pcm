'use client';

import { useState } from 'react';
import { createNews } from '@/lib/api-client/actions';

export function CreateNewsForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSending(true);
    setMessage(null);

    const result = await createNews(title, description, imageUrl || undefined);

    if ('error' in result) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Actualite publiee' });
      setTitle('');
      setDescription('');
      setImageUrl('');
    }

    setSending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Titre</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Titre de l'actualite..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={4}
          placeholder="Description de l'actualite..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Image URL (optionnel)</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {message && (
        <p className={message.type === 'error' ? 'text-red-500' : 'text-green-500'}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={sending || !title.trim() || !description.trim()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {sending ? 'Publication...' : 'Publier'}
      </button>
    </form>
  );
}

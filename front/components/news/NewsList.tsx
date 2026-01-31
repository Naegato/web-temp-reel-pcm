'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { News } from '@/lib/auth/types';
import { connectNewsSSE } from '@/lib/sse';

type Props = {
  token: string;
};

export function NewsList({ token }: Props) {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const disconnect = connectNewsSSE(token, (event) => {
      if (event.type === 'init') {
        setNews(event.news);
        setLoading(false);
      } else if (event.type === 'new') {
        setNews((prev) => [event.news, ...prev]);
      }
    });

    return disconnect;
  }, [token]);

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (news.length === 0) {
    return <p>Aucune actualite.</p>;
  }

  return (
    <ul className="space-y-4">
      {news.map((item) => (
        <li key={item.id} className="p-4 border rounded">
          {item.imageUrl && (
            <div className="relative w-full h-48 mb-3">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover rounded"
                unoptimized
              />
            </div>
          )}
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-gray-600 mt-1">{item.description}</p>
          <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
            <span>Par {item.author.email}</span>
            <span>{new Date(item.createdAt).toLocaleString('fr-FR')}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

'use client';

import { connectClientToAdvisor } from '@/lib/api-client/actions';
import { UnassignedUser } from '@/lib/auth/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type UserListProps = {
  users: UnassignedUser[];
};

export function UserList({ users }: UserListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleConnect(userId: string) {
    setLoading(userId);
    const result = await connectClientToAdvisor([userId]);
    setLoading(null);

    if ('error' in result) {
      alert(result.error);
      return;
    }

    router.refresh();
  }

  if (users.length === 0) {
    return <p>Aucun utilisateur non assigné.</p>;
  }

  return (
    <table className="border w-full">
      <thead>
        <tr>
          <th className="border p-2">ID</th>
          <th className="border p-2">Email</th>
          <th className="border p-2">Date de création</th>
          <th className="border p-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td className="border p-2">{user.id}</td>
            <td className="border p-2">{user.email}</td>
            <td className="border p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
            <td className="border p-2">
              <button
                onClick={() => handleConnect(user.id)}
                disabled={loading === user.id}
                className="border px-2 py-1"
              >
                {loading === user.id ? 'Connexion...' : 'Connecter'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

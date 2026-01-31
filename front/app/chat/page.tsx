import { getMyAdvisor, getMe } from '@/lib/api-client/actions';
import { Role } from '@/lib/auth/types';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  const user = await getMe();

  if (!user) {
    redirect('/login');
  }

  if (user.role === Role.USER) {
    const advisor = await getMyAdvisor();

    if (!advisor) {
      return (
        <div className="p-4">
          <h1 className="text-xl mb-4">Chat</h1>
          <p>Vous n'avez pas encore de conseiller.</p>
        </div>
      );
    }

    return (
      <div className="p-4">
        <h1 className="text-xl mb-4">Chat avec {advisor.email}</h1>
        <p>Chat à implémenter...</p>
      </div>
    );
  }

  // Advisor view
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Chat Conseiller</h1>
      <p>Chat à implémenter...</p>
    </div>
  );
}

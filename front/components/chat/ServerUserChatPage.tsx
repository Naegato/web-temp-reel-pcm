import { getToken, getUserAdvisorChat, getMyAdvisor, getMe } from '@/lib/api-client/actions';
import { redirect } from 'next/navigation';
import { ClientUserChatPage } from './ClientUserChatPage';

export async function ServerUserChatPage() {
  const [token, user, advisor, chat] = await Promise.all([
    getToken(),
    getMe(),
    getMyAdvisor(),
    getUserAdvisorChat(),
  ]);

  if (!token || !user) {
    redirect('/login');
  }

  if (!advisor) {
    return (
      <div className="p-4">
        <h1 className="text-xl mb-4">Chat</h1>
        <p>Vous n'avez pas encore de conseiller.</p>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="p-4">
        <h1 className="text-xl mb-4">Chat</h1>
        <p>Erreur lors du chargement du chat.</p>
      </div>
    );
  }

  return (
    <ClientUserChatPage
      token={token}
      chat={chat}
      advisor={advisor}
      currentUserId={user.id}
    />
  );
}

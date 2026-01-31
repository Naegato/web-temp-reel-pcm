import { getToken, getAdvisorGlobalChat, getMyClientChats, getMe } from '@/lib/api-client/actions';
import { redirect } from 'next/navigation';
import { ClientAdvisorChatPage } from './ClientAdvisorChatPage';

export async function ServerAdvisorChatPage() {
  const [token, user, globalChat, clientChats] = await Promise.all([
    getToken(),
    getMe(),
    getAdvisorGlobalChat(),
    getMyClientChats(),
  ]);

  if (!token || !user) {
    redirect('/login');
  }

  if (!globalChat) {
    return (
      <div className="p-4">
        <h1 className="text-xl mb-4">Chat Conseiller</h1>
        <p>Erreur lors du chargement du chat global.</p>
      </div>
    );
  }

  return (
    <ClientAdvisorChatPage
      token={token}
      globalChat={globalChat}
      clientChats={clientChats ?? []}
      currentUserId={user.id}
    />
  );
}

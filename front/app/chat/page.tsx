import { getMe } from '@/lib/api-client/actions';
import { Role, isAdvisorOrAdmin } from '@/lib/auth/types';
import { redirect } from 'next/navigation';
import { ServerUserChatPage } from '@/components/chat/ServerUserChatPage';
import { ServerAdvisorChatPage } from '@/components/chat/ServerAdvisorChatPage';

export default async function ChatPage() {
  const user = await getMe();

  if (!user) {
    redirect('/login');
  }

  if (isAdvisorOrAdmin(user.role)) {
    return <ServerAdvisorChatPage />;
  }

  return <ServerUserChatPage />;
}

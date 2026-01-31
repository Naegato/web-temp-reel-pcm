import { getMe } from '@/lib/api-client/actions';
import { Role } from '@/lib/auth/types';
import { redirect } from 'next/navigation';
import { ServerUserChatPage } from '@/components/chat/ServerUserChatPage';
import { ServerAdvisorChatPage } from '@/components/chat/ServerAdvisorChatPage';

export default async function ChatPage() {
  const user = await getMe();

  if (!user) {
    redirect('/login');
  }

  if (user.role === Role.USER) {
    return <ServerUserChatPage />;
  }

  return <ServerAdvisorChatPage />;
}

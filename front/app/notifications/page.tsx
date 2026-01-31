import { getMe, getToken, getMyClients } from '@/lib/api-client/actions';
import { Role } from '@/lib/auth/types';
import { redirect } from 'next/navigation';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { CreateNotificationForm } from '@/components/notifications/CreateNotificationForm';

export default async function NotificationsPage() {
  const [user, token] = await Promise.all([getMe(), getToken()]);

  if (!user || !token) {
    redirect('/login');
  }

  const isAdvisor = user.role === Role.ADVISOR;
  const clients = isAdvisor ? await getMyClients() : null;

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Notifications</h1>

      <div className={isAdvisor ? 'flex gap-8' : ''}>
        <div className={isAdvisor ? 'flex-1' : ''}>
          <h2 className="font-bold mb-2">Mes notifications</h2>
          <NotificationsList token={token} />
        </div>

        {isAdvisor && (
          <div className="w-80">
            <h2 className="font-bold mb-2">Envoyer une notification</h2>
            <CreateNotificationForm clients={clients ?? []} />
          </div>
        )}
      </div>
    </div>
  );
}

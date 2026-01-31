import { getMe, getNotification } from '@/lib/api-client/actions';
import { redirect, notFound } from 'next/navigation';
import { NotificationDetail } from '@/components/notifications/NotificationDetail';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NotificationPage({ params }: Props) {
  const { id } = await params;
  const user = await getMe();

  if (!user) {
    redirect('/login');
  }

  const notification = await getNotification(id);

  if (!notification) {
    notFound();
  }

  return (
    <div className="p-4">
      <NotificationDetail notification={notification} />
    </div>
  );
}

import { getMe, getToken } from '@/lib/api-client/actions';
import { isAdvisorOrAdmin } from '@/lib/auth/types';
import { redirect } from 'next/navigation';
import { NewsList } from '@/components/news/NewsList';
import { CreateNewsForm } from '@/components/news/CreateNewsForm';

export default async function NewsletterPage() {
  const [user, token] = await Promise.all([getMe(), getToken()]);

  if (!user || !token) {
    redirect('/login');
  }

  const isAdvisor = isAdvisorOrAdmin(user.role);

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Actualites</h1>

      <div className={isAdvisor ? 'flex gap-8' : ''}>
        <div className={isAdvisor ? 'flex-1' : ''}>
          <h2 className="font-bold mb-2">Fil d&apos;actualites</h2>
          <NewsList token={token} />
        </div>

        {isAdvisor && (
          <div className="w-80">
            <h2 className="font-bold mb-2">Publier une actualite</h2>
            <CreateNewsForm />
          </div>
        )}
      </div>
    </div>
  );
}

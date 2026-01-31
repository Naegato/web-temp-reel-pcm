import { getMyClients, getMe } from '@/lib/api-client/actions';
import { isAdvisorOrAdmin } from '@/lib/auth/types';
import { redirect } from 'next/navigation';

export default async function ClientsPage() {
  const user = await getMe();

  if (!user || !isAdvisorOrAdmin(user.role)) {
    redirect('/');
  }

  const clients = await getMyClients();

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Mes clients</h1>
      {clients && clients.length > 0 ? (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Date d'inscription</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="border p-2">{client.email}</td>
                <td className="border p-2">
                  {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Aucun client pour le moment.</p>
      )}
    </div>
  );
}

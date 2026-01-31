import { getUsersUnassigned } from '@/lib/api-client/actions';
import { UserList } from '@/components/user-list';

export default async function ConnectPage() {
  const users = await getUsersUnassigned();

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Clients non assignés</h1>
      <UserList users={users ?? []} />
    </div>
  );
}

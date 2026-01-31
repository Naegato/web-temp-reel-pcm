import { getMe } from '@/lib/api-client/actions';
import { Role } from '@/lib/auth/types';

export default async function Home() {
  const user = (await getMe())!

  console.log('Home page user:', user);
  console.log('User role:', user.role, Role.ADVISOR);

  if (user.role === Role.ADVISOR) {
    return <div>
      Welcome, Advisor!
    </div>;
  } else {
    return <div>
      Welcome, User!
    </div>;
  }
}

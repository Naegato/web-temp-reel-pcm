import { getMe } from '@/lib/api-client/actions';
import { Role } from '@/lib/auth/types';

export default async function Home() {
  const user = (await getMe())!

  if (user.role === Role.ADMIN) {
    return <div>
      Welcome, Admin!
    </div>;
  } else if (user.role === Role.ADVISOR) {
    return <div>
      Welcome, Advisor!
    </div>;
  } else {
    return <div>
      Welcome, User!
    </div>;
  }
}

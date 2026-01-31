'use client';

import { login } from '@/lib/api-client/actions';
import { useAuth } from '@/lib/auth/context';
import { Role } from '@/lib/auth/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const NavBar = () => {
  const { user, refresh } = useAuth();
  const router = useRouter();

  return <nav>
    <ul className="flex flex-wrap gap-2 border-b">
      {user ? <>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/chat">Chat</Link>
        </li>
        {user.role === Role.ADVISOR && <>
          <li>
            <Link href="/clients">Clients</Link>
          </li>
          <li>
            <Link href="/connect">Connect</Link>
          </li>
        </>}
        <li>
          <button
            onClick={async () => {
              await login(null);
              await refresh();
              router.push('/login');
            }}
          >
            Logout
          </button>
        </li>
      </> : <>
        <li>
          <Link href="/login">Login</Link>
        </li>
        <li>
          <Link href="/register">Register</Link>
        </li>
      </>}
    </ul>
  </nav>
}
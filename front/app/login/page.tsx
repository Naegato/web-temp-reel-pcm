import { FormLogin } from '@/components/form-login';
import Link from 'next/link';

export default function Page() {
  return <div>
    <h1>Login Page</h1>
    <FormLogin />
    <p>
      Don&#39;t have an account? <Link href="/register" className="text-blue-500 underline">Register here</Link>.
    </p>
  </div>
}
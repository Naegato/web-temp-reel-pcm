import { FormRegister } from '@/components/form-register';
import Link from 'next/link';

export default function Page() {
  return <div>
    <h1>Register Page</h1>
    <FormRegister />
    <p>
      Already have an account? <Link href="/login" className="text-blue-500 underline">Login here</Link>.
    </p>
  </div>
}

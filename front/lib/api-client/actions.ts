'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getApiClient } from './index';

export async function login(token: string | null, redirectTo?: string) {
  const cookiesStore = await cookies();

  if (token) {
    cookiesStore.set({
      name: 'token',
      value: token,
    });
  } else {
    cookiesStore.delete('token');
  }

  if (redirectTo) {
    throw redirect(redirectTo);
  }

  return true;
}

export async function getMe() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get('token')?.value;

  if (!token) {
    return null;
  }

  const result = await getApiClient(token).me();

  if ('error' in result) {
    return null;
  }

  return result;
}
'use server';

import { cookies } from 'next/headers';
import { getApiClient } from './index';

export async function login(token: string | null) {
  const cookiesStore = await cookies();

  if (token) {
    cookiesStore.set({
      name: 'token',
      value: token,
    });
  } else {
    cookiesStore.delete('token');
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

export async function isLoggedIn() {
  const user = await getMe();
  return user !== null;
}

export async function getUsersUnassigned() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get('token')?.value;

  if (!token) {
    return null;
  }

  const result = await getApiClient(token).getUsersUnassigned();

  if ('error' in result) {
    return null;
  }

  return result;
}

export async function connectClientToAdvisor(userIds: string[]) {
  const cookiesStore = await cookies();
  const token = cookiesStore.get('token')?.value;

  if (!token) {
    return { error: 'Not authenticated' };
  }

  const result = await getApiClient(token).connectClientToAdvisor(userIds);

  return result;
}

export async function getMyAdvisor() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get('token')?.value;

  if (!token) {
    return null;
  }

  const result = await getApiClient(token).getMyAdvisor();

  if ('error' in result) {
    return null;
  }

  return result;
}

export async function getMyClients() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get('token')?.value;

  if (!token) {
    return null;
  }

  const result = await getApiClient(token).getMyClients();

  if ('error' in result) {
    return null;
  }

  return result;
}

export async function getToken() {
  const cookiesStore = await cookies();
  return cookiesStore.get('token')?.value ?? null;
}

export async function getAdvisorGlobalChat() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get('token')?.value;

  if (!token) {
    return null;
  }

  const result = await getApiClient(token).getAdvisorGlobalChat();

  if ('error' in result) {
    return null;
  }

  return result;
}

export async function getUserAdvisorChat() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get('token')?.value;

  if (!token) {
    return null;
  }

  const result = await getApiClient(token).getUserAdvisorChat();

  if ('error' in result) {
    return null;
  }

  return result;
}

export async function getMyClientChats() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get('token')?.value;

  if (!token) {
    return null;
  }

  const result = await getApiClient(token).getMyClientChats();

  if ('error' in result) {
    return null;
  }

  return result;
}
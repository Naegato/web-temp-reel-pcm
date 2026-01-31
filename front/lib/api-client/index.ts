import { User, UnassignedUser, Advisor, Client } from '@/lib/auth/types';
import { z } from 'zod';

type ResponseError = {
  error: string;
  details?: z.core.$ZodIssue[];
};

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string, token: null | string = null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async get<T = never>(endpoint: string): Promise<T | ResponseError> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
    });
    return response.json();
  }

  async post<T = never, U = never>(endpoint: string, data: T): Promise<U | ResponseError> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async login(email: string, password: string) {
    return await this.post<{ email: string; password: string }, { token: string }>('login', { email, password });
  }

  async register(email: string, password: string) {
    return await this.post<{ email: string; password: string }, User>('register', { email, password });
  }

  async me() {
    return await this.get<User>('me');
  }

  async getUsersUnassigned() {
    return await this.get<UnassignedUser[]>('users/unassigned');
  }

  async connectClientToAdvisor(userIds: string[]) {
    return await this.post<{ userIds: string[] }, { message: string }>('connect', { userIds });
  }

  async getMyAdvisor() {
    return await this.get<Advisor>('users/my-advisor');
  }

  async getMyClients() {
    return await this.get<Client[]>('users/my-clients');
  }
}

export const getApiClient = (token: null | string = null): ApiClient => {
  const baseUrl = 'http://localhost:4000/'
  return new ApiClient(baseUrl, token);
}
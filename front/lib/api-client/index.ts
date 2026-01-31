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
    return await this.post<{ email: string; password: string }, { id: string; email: string; role: string }>('register', { email, password });
  }

  async me() {
    return await this.get<{ id: string; email: string; role: string }>('me');
  }
}

export const getApiClient = (token: null | string = null): ApiClient => {
  const baseUrl = 'http://localhost:4000/'
  return new ApiClient(baseUrl, token);
}
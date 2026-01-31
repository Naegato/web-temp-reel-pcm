import { User, UnassignedUser, Advisor, Client, Chat, ClientChat, Message, Notification, News } from '@/lib/auth/types';
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

  async getAdvisorGlobalChat() {
    return await this.get<Chat>('chats/advisor-global');
  }

  async getUserAdvisorChat() {
    return await this.post<object, Chat>('chats/user-advisor', {});
  }

  async getMyClientChats() {
    return await this.get<ClientChat[]>('chats/my-clients');
  }

  async getChatMessages(chatId: string, cursor?: string, limit?: number) {
    let url = `chats/${chatId}/messages`;
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', limit.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return await this.get<{ messages: Message[]; nextCursor: string | null }>(url);
  }

  async delete<T = never>(endpoint: string): Promise<T | ResponseError> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
    });
    return response.json();
  }

  async getNotification(id: string) {
    return await this.get<Notification>(`notifications/${id}`);
  }

  async deleteNotification(id: string) {
    return await this.delete<{ message: string }>(`notifications/${id}`);
  }

  async createNotification(userId: string, content: string) {
    return await this.post<{ userId: string; content: string }, Notification>('notifications', { userId, content });
  }

  async createNews(title: string, description: string, imageUrl?: string) {
    return await this.post<{ title: string; description: string; imageUrl?: string }, News>('news', { title, description, imageUrl });
  }
}

export const getApiClient = (token: null | string = null): ApiClient => {
  const baseUrl = 'http://localhost:4000/'
  return new ApiClient(baseUrl, token);
}
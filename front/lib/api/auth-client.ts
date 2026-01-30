/**
 * Authenticated API client for protected endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class AuthenticatedApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the auth token from cookies
   */
  private getAuthToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='));
    
    return cookie ? cookie.split('=')[1] : null;
  }

  /**
   * Generic authenticated request method
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const url = `/api/proxy${endpoint}`;
    
    console.log('🌐 API Request:', { method: options.method || 'GET', url, hasToken: !!token });
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // Le proxy Next.js va gérer l'auth automatiquement via les cookies
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ API Error:', { status: response.status, url, errorData });
      throw new Error(errorData?.message || `Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Success:', { url, dataReceived: !!data });
    return data;
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const authClient = new AuthenticatedApiClient();
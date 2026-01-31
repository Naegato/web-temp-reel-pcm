import { NotificationEvent, NewChatEvent, NewsEvent } from '@/lib/auth/types';

const BASE_URL = 'http://localhost:4000';

export function connectNotificationsSSE(
  token: string,
  onEvent: (event: NotificationEvent) => void,
  onError?: () => void
): () => void {
  let controller: AbortController | null = new AbortController();

  async function connect() {
    try {
      const response = await fetch(`${BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller?.signal,
      });

      if (!response.ok || !response.body) {
        onError?.();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as NotificationEvent;
              onEvent(data);
            } catch {
                          }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        onError?.();
      }
    }
  }

  connect();

  return () => {
    controller?.abort();
    controller = null;
  };
}

export function connectChatsSSE(
  token: string,
  onEvent: (event: NewChatEvent) => void,
  onError?: () => void
): () => void {
  let controller: AbortController | null = new AbortController();

  async function connect() {
    try {
      const response = await fetch(`${BASE_URL}/chats/stream`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller?.signal,
      });

      if (!response.ok || !response.body) {
        onError?.();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as NewChatEvent;
              onEvent(data);
            } catch {
                          }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        onError?.();
      }
    }
  }

  connect();

  return () => {
    controller?.abort();
    controller = null;
  };
}

export function connectNewsSSE(
  token: string,
  onEvent: (event: NewsEvent) => void,
  onError?: () => void
): () => void {
  let controller: AbortController | null = new AbortController();

  async function connect() {
    try {
      const response = await fetch(`${BASE_URL}/news/stream`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller?.signal,
      });

      if (!response.ok || !response.body) {
        onError?.();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as NewsEvent;
              onEvent(data);
            } catch {
                          }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        onError?.();
      }
    }
  }

  connect();

  return () => {
    controller?.abort();
    controller = null;
  };
}

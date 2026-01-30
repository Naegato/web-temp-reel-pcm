// Service WebSocket pour le chat en temps réel
import { io, Socket } from 'socket.io-client';
import type { 
  WebSocketChatEvents, 
  WebSocketChatListeners,
  SendMessageDto,
  JoinChatDto,
  MessageResponseDto,
  ChatResponseDto
} from '@/lib/types/chat';

class ChatSocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // ms

  /**
   * Se connecter au serveur WebSocket avec authentification
   */
  async connect(token: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Utiliser directement l'URL du backend pour WebSocket (pas de proxy)
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      this.socket = io(`${socketUrl}/chat`, {
        auth: {
          token: token // Token sans Bearer prefix pour auth
        },
        extraHeaders: {
          'Authorization': `Bearer ${token}` // Token avec Bearer prefix pour headers
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        autoConnect: false
      });

      // Gestionnaires d'événements de connexion
      this.socket.on('connect', () => {
        console.log('🔌 WebSocket Connected:', { 
          socketId: this.socket?.id, 
          transport: this.socket?.io.engine.transport.name 
        });
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('🔌 WebSocket Disconnected:', { 
          reason, 
          socketId: this.socket?.id,
          transport: this.socket?.io.engine?.transport?.name 
        });
        this.isConnecting = false;
        
        // Tentative de reconnexion automatique
        if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('🔌 WebSocket Connection Error:', { 
          error: error.message, 
          type: error.type,
          description: error.description 
        });
        this.isConnecting = false;
        this.scheduleReconnect();
      });

      // Connexion effective
      this.socket.connect();

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket non initialisé'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('Timeout de connexion WebSocket'));
        }, 10000);

        this.socket.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Se déconnecter du WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Programmer une tentative de reconnexion
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌 Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log('🔌 Scheduling reconnection:', { 
      attempt: `${this.reconnectAttempts}/${this.maxReconnectAttempts}`, 
      delayMs: delay 
    });
    
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        console.log('🔌 Attempting reconnection...');
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Rejoindre un chat spécifique
   */
  joinChat(chatId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket non connecté');
    }
    
    this.socket.emit('join_chat', { chatId });
  }

  /**
   * Quitter un chat
   */
  leaveChat(chatId: string): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket non connecté lors de la tentative de quitter le chat');
      return;
    }
    
    this.socket.emit('leave_chat', { chatId });
  }

  /**
   * Envoyer un message en temps réel
   */
  sendMessage(data: SendMessageDto): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket non connecté');
    }
    
    this.socket.emit('send_message', data);
  }

  /**
   * S'assigner un chat (pour les advisors)
   */
  assignChat(chatId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket non connecté');
    }
    
    this.socket.emit('assign_chat', { chatId });
  }

  /**
   * Fermer un chat (pour les advisors)
   */
  closeChat(chatId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket non connecté');
    }
    
    this.socket.emit('close_chat', { chatId });
  }

  /**
   * Demander la liste des chats en attente (pour les advisors)
   */
  getWaitingChats(): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket non connecté');
    }
    
    this.socket.emit('get_waiting_chats');
  }

  /**
   * Écouter les nouveaux messages
   */
  onNewMessage(callback: (message: MessageResponseDto) => void): () => void {
    if (!this.socket) {
      throw new Error('WebSocket non initialisé');
    }
    
    this.socket.on('new_message', callback);
    
    // Retourner une fonction de nettoyage
    return () => {
      this.socket?.off('new_message', callback);
    };
  }

  /**
   * Écouter l'assignation de chats
   */
  onChatAssigned(callback: (chat: ChatResponseDto) => void): () => void {
    if (!this.socket) {
      throw new Error('WebSocket non initialisé');
    }
    
    this.socket.on('chat_assigned', callback);
    
    return () => {
      this.socket?.off('chat_assigned', callback);
    };
  }

  /**
   * Écouter quand un advisor est assigné à mon chat
   */
  onAdvisorAssigned(callback: (chat: ChatResponseDto) => void): () => void {
    if (!this.socket) {
      throw new Error('WebSocket non initialisé');
    }
    
    this.socket.on('advisor_assigned', callback);
    
    return () => {
      this.socket?.off('advisor_assigned', callback);
    };
  }

  /**
   * Écouter la fermeture de chats
   */
  onChatClosed(callback: (chat: ChatResponseDto) => void): () => void {
    if (!this.socket) {
      throw new Error('WebSocket non initialisé');
    }
    
    this.socket.on('chat_closed', callback);
    
    return () => {
      this.socket?.off('chat_closed', callback);
    };
  }

  /**
   * Écouter les nouveaux chats en attente (pour les advisors)
   */
  onNewChatWaiting(callback: (chat: ChatResponseDto) => void): () => void {
    if (!this.socket) {
      throw new Error('WebSocket non initialisé');
    }
    
    this.socket.on('new_chat_waiting', callback);
    
    return () => {
      this.socket?.off('new_chat_waiting', callback);
    };
  }

  /**
   * Écouter la liste des chats en attente
   */
  onWaitingChats(callback: (chats: ChatResponseDto[]) => void): () => void {
    if (!this.socket) {
      throw new Error('WebSocket non initialisé');
    }
    
    this.socket.on('waiting_chats', callback);
    
    return () => {
      this.socket?.off('waiting_chats', callback);
    };
  }

  /**
   * Vérifier si le socket est connecté
   */
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtenir l'ID de socket pour le débogage
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

// Instance singleton
export const chatSocketService = new ChatSocketService();

// Export par défaut
export default chatSocketService;
// Client API pour les fonctionnalités de chat
import { authClient } from './auth-client';
import type { 
  Chat, 
  CreateChatDto, 
  SendMessageDto, 
  ChatResponseDto,
  MessageResponseDto 
} from '@/lib/types/chat';

export class ChatApi {
  /**
   * Créer un nouveau chat (CLIENT uniquement)
   */
  static async createChat(data: CreateChatDto): Promise<Chat> {
    const response = await authClient.post<ChatResponseDto>('/chat', data);
    return this.transformChatResponse(response);
  }

  /**
   * Récupérer tous mes chats (CLIENT et ADVISOR)
   */
  static async getMyChats(): Promise<Chat[]> {
    const response = await authClient.get<ChatResponseDto[]>('/chat/my-chats');
    return response.map(this.transformChatResponse);
  }

  /**
   * Récupérer les chats en attente (ADVISOR uniquement)
   */
  static async getWaitingChats(): Promise<Chat[]> {
    const response = await authClient.get<ChatResponseDto[]>('/chat/waiting');
    return response.map(this.transformChatResponse);
  }

  /**
   * Récupérer un chat spécifique par ID
   */
  static async getChatById(chatId: string): Promise<Chat> {
    const response = await authClient.get<ChatResponseDto>(`/chat/${chatId}`);
    return this.transformChatResponse(response);
  }

  /**
   * S'assigner un chat en attente (ADVISOR uniquement)
   */
  static async assignChat(chatId: string): Promise<Chat> {
    const response = await authClient.post<ChatResponseDto>(`/chat/${chatId}/assign`);
    return this.transformChatResponse(response);
  }

  /**
   * Fermer un chat (ADVISOR uniquement)
   */
  static async closeChat(chatId: string): Promise<Chat> {
    const response = await authClient.post<ChatResponseDto>(`/chat/${chatId}/close`);
    return this.transformChatResponse(response);
  }

  /**
   * Envoyer un message via REST (fallback si WebSocket n'est pas disponible)
   */
  static async sendMessage(data: SendMessageDto): Promise<MessageResponseDto> {
    const response = await authClient.post<MessageResponseDto>('/chat/message', data);
    return response;
  }

  /**
   * Transformer la réponse API en objet Chat côté frontend
   */
  private static transformChatResponse(chatResponse: ChatResponseDto): Chat {
    return {
      id: chatResponse.id,
      status: chatResponse.status,
      subject: chatResponse.subject,
      clientId: chatResponse.clientId,
      advisorId: chatResponse.advisorId,
      createdAt: chatResponse.createdAt,
      updatedAt: chatResponse.updatedAt,
      client: chatResponse.client,
      advisor: chatResponse.advisor,
      messages: chatResponse.messages?.map(msg => ({
        id: msg.id,
        content: msg.content,
        authorId: msg.authorId,
        chatId: msg.chatId,
        createdAt: msg.createdAt,
        author: msg.author
      })) || []
    };
  }
}

// Types d'erreur spécifiques au chat
export class ChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

// Gestion d'erreur spécialisée pour les API de chat
export function handleChatError(error: any): ChatError {
  if (error.response?.data?.message) {
    return new ChatError(
      error.response.data.message,
      error.response.data.code || 'CHAT_ERROR',
      error.response.status
    );
  }

  if (error.code === 'NETWORK_ERROR') {
    return new ChatError(
      'Erreur de connexion. Vérifiez votre connexion internet.',
      'NETWORK_ERROR'
    );
  }

  return new ChatError(
    'Une erreur inattendue s\'est produite.',
    'UNKNOWN_ERROR'
  );
}
// Types pour le système de chat côté frontend

export enum Role {
  CLIENT = 'CLIENT',
  ADVISOR = 'ADVISOR'
}

export enum ChatStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED'
}

// Types de base des entités
export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: Role;
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  chatId: string;
  createdAt: string;
  author: User;
}

export interface Chat {
  id: string;
  status: ChatStatus;
  subject?: string;
  clientId: string;
  advisorId?: string;
  createdAt: string;
  updatedAt: string;
  client: User;
  advisor?: User;
  messages: Message[];
}

// DTOs pour les API calls
export interface CreateChatDto {
  initialMessage?: string;
  subject?: string;
}

export interface SendMessageDto {
  chatId: string;
  content: string;
}

export interface JoinChatDto {
  chatId: string;
}

// Types de réponses API
export interface ChatResponseDto {
  id: string;
  status: ChatStatus;
  subject?: string;
  clientId: string;
  advisorId?: string;
  createdAt: string;
  updatedAt: string;
  client: User;
  advisor?: User;
  messages?: MessageResponseDto[];
}

export interface MessageResponseDto {
  id: string;
  content: string;
  authorId: string;
  chatId: string;
  createdAt: string;
  author: User;
}

// Types pour les événements WebSocket
export interface WebSocketChatEvents {
  // Événements émis par le client
  join_chat: JoinChatDto;
  leave_chat: JoinChatDto;
  send_message: SendMessageDto;
  assign_chat: JoinChatDto;
  close_chat: JoinChatDto;
  get_waiting_chats: void;
}

export interface WebSocketChatListeners {
  // Événements reçus du serveur
  new_message: MessageResponseDto;
  chat_assigned: ChatResponseDto;
  advisor_assigned: ChatResponseDto;
  chat_closed: ChatResponseDto;
  new_chat_waiting: ChatResponseDto;
  waiting_chats: ChatResponseDto[];
}

// Types pour les composants
export interface ChatListProps {
  chats: Chat[];
  onChatSelect: (chat: Chat) => void;
  selectedChatId?: string;
}

export interface ChatWindowProps {
  chat: Chat;
  currentUser: User;
  onSendMessage: (content: string) => void;
  onAssignChat?: () => void;
  onCloseChat?: () => void;
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Types pour les hooks
export interface UseChatOptions {
  chatId?: string;
  autoConnect?: boolean;
}

export interface UseChatReturn {
  chat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  joinChat: (chatId: string) => void;
  leaveChat: () => void;
  assignChat: () => Promise<void>;
  closeChat: () => Promise<void>;
}

export interface UseChatsReturn {
  chats: Chat[];
  waitingChats: Chat[];
  isLoading: boolean;
  error: string | null;
  createChat: (data: CreateChatDto) => Promise<Chat>;
  refreshChats: () => Promise<void>;
}

// Types pour le contexte de chat
export interface ChatContextType {
  chats: Chat[];
  waitingChats: Chat[];
  currentChat: Chat | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createChat: (data: CreateChatDto) => Promise<Chat>;
  selectChat: (chatId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  assignChat: (chatId: string) => Promise<void>;
  closeChat: (chatId: string) => Promise<void>;
  refreshChats: () => Promise<void>;
}

// Types pour les filtres et tri
export interface ChatFilters {
  status?: ChatStatus;
  role?: Role;
  search?: string;
}

export interface ChatSortOptions {
  field: 'createdAt' | 'updatedAt' | 'status';
  direction: 'asc' | 'desc';
}
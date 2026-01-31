export enum Role {
  USER = 'USER',
  ADVISOR = 'ADVISOR',
  ADMIN = 'ADMIN',
}

export const isAdvisorOrAdmin = (role: Role): boolean => {
  return role === Role.ADVISOR || role === Role.ADMIN;
};

export type User = {
  id: string;
  email: string;
  role: Role;
};

export type UnassignedUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type Advisor = {
  id: string;
  email: string;
};

export type Client = {
  id: string;
  email: string;
  createdAt: string;
};

export type MessageSender = {
  id: string;
  email: string;
  role?: Role;
};

export type Message = {
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  createdAt: string;
  sender: MessageSender;
};

export type Chat = {
  id: string;
  type: 'GLOBAL_ADVISOR' | 'USER_ADVISOR';
  userId: string | null;
  createdAt: string;
  messages: Message[];
};

export type ClientChat = {
  id: string;
  type: 'USER_ADVISOR';
  userId: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
  messages: { id: string; content: string; createdAt: string }[];
};

export type Notification = {
  id: string;
  content: string;
  read: boolean;
  userId: string;
  createdAt: string;
};

export type NewChatEvent = {
  type: 'new_chat';
  chat: {
    id: string;
    userId: string;
    user: { id: string; email: string };
  };
};

export type NotificationEvent =
  | { type: 'init'; notifications: Notification[] }
  | { type: 'new'; notification: Notification };
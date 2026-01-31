export enum Role {
  USER = 'USER',
  ADVISOR = 'ADVISOR',
}

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
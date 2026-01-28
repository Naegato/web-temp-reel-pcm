import { ChatStatus, Role } from 'src/generated/prisma/client';

export class ChatResponseDto {
  id: string;
  status: ChatStatus;
  subject?: string;
  clientId: string;
  advisorId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Informations sur les participants
  client?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  
  advisor?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  
  // Messages récents (optionnel)
  messages?: MessageResponseDto[];
}

export class MessageResponseDto {
  id: string;
  content: string;
  chatId: string;
  authorId: string;
  createdAt: Date;
  
  // Informations sur l'auteur
  author: {
    id: string;
    firstname: string;
    lastname: string;
    role: Role;
  };
}
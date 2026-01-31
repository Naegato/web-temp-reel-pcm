import { io, Socket } from 'socket.io-client';
import { Message } from '@/lib/auth/types';

let socket: Socket | null = null;
let currentToken: string | null = null;

export const getSocket = (token: string): Socket => {
  // Si le token a changé, déconnecter l'ancien socket
  if (socket && currentToken !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    currentToken = token;
    socket = io('http://localhost:4000', {
      auth: { token },
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};

export const joinAdvisorGlobalChat = (socket: Socket) => {
  socket.emit('join:advisor-global');
};

export const joinUserAdvisorChat = (socket: Socket, chatId: string) => {
  socket.emit('join:user-advisor', { chatId });
};

export const sendMessage = (socket: Socket, chatId: string, content: string) => {
  socket.emit('message:send', { chatId, content });
};

export const onNewMessage = (socket: Socket, callback: (message: Message) => void) => {
  // Enlever les anciens listeners avant d'en ajouter un nouveau
  socket.off('message:new');
  socket.on('message:new', callback);
};

export const offNewMessage = (socket: Socket) => {
  socket.off('message:new');
};

export const onJoined = (socket: Socket, callback: (data: { chatId: string }) => void) => {
  socket.off('joined');
  socket.on('joined', callback);
};

export const onError = (socket: Socket, callback: (data: { message: string }) => void) => {
  socket.off('error');
  socket.on('error', callback);
};

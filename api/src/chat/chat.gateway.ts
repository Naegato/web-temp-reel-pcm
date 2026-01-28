import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { UsersService } from 'src/users/users.service';
import { SendMessageDto, JoinChatDto } from './dto';
import { Role } from 'src/generated/prisma/client';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: Role;
    firstname: string;
    lastname: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*', // En production, spécifiez l'origine exacte
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extraire et vérifier le token JWT
      const token = this.extractTokenFromHandshake(client);
      if (!token) {
        throw new UnauthorizedException('Token manquant');
      }

      // Vérifier et décoder le token
      const payload = await this.jwtService.verifyAsync(token);
      
      // Récupérer les données utilisateur complètes
      const user = await this.usersService.findProfileById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Utilisateur non valide');
      }

      // Attacher les données utilisateur au socket
      client.user = user;
      
      // Enregistrer la connexion
      this.connectedUsers.set(user.id, client.id);

      // Rejoindre des rooms basées sur le rôle
      if (user.role === Role.ADVISOR) {
        await client.join('advisors'); // Room pour les advisors
      }

      this.logger.log(`Utilisateur connecté: ${user.firstname} ${user.lastname} (${user.role}) - Socket: ${client.id}`);

      // Notifier l'utilisateur que la connexion est réussie
      client.emit('connected', {
        message: 'Connexion établie',
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
        },
      });

    } catch (error) {
      this.logger.error(`Erreur d'authentification: ${error.message}`);
      client.emit('error', { message: 'Authentification échouée' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.connectedUsers.delete(client.user.id);
      this.logger.log(`Utilisateur déconnecté: ${client.user.firstname} ${client.user.lastname} - Socket: ${client.id}`);
    }
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() joinChatDto: JoinChatDto,
  ) {
    try {
      if (!client.user) {
        throw new UnauthorizedException('Utilisateur non authentifié');
      }

      // Vérifier que l'utilisateur a accès à ce chat
      const chat = await this.chatService.getChatById(joinChatDto.chatId, client.user.id);
      
      // Rejoindre la room du chat
      await client.join(`chat_${chat.id}`);
      
      this.logger.log(`Utilisateur ${client.user.firstname} a rejoint le chat ${chat.id}`);
      
      // Confirmer la participation au chat
      client.emit('chat_joined', {
        message: 'Chat rejoint avec succès',
        chat,
      });

      // Notifier les autres participants qu'un utilisateur a rejoint
      client.to(`chat_${chat.id}`).emit('user_joined_chat', {
        user: {
          id: client.user.id,
          firstname: client.user.firstname,
          lastname: client.user.lastname,
          role: client.user.role,
        },
        chatId: chat.id,
      });

    } catch (error) {
      this.logger.error(`Erreur join_chat: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      if (!client.user) {
        throw new UnauthorizedException('Utilisateur non authentifié');
      }

      await client.leave(`chat_${data.chatId}`);
      
      this.logger.log(`Utilisateur ${client.user.firstname} a quitté le chat ${data.chatId}`);
      
      // Notifier les autres participants
      client.to(`chat_${data.chatId}`).emit('user_left_chat', {
        user: {
          id: client.user.id,
          firstname: client.user.firstname,
          lastname: client.user.lastname,
          role: client.user.role,
        },
        chatId: data.chatId,
      });

      client.emit('chat_left', {
        message: 'Chat quitté avec succès',
        chatId: data.chatId,
      });

    } catch (error) {
      this.logger.error(`Erreur leave_chat: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() sendMessageDto: SendMessageDto,
  ) {
    try {
      if (!client.user) {
        throw new UnauthorizedException('Utilisateur non authentifié');
      }

      // Envoyer le message via le service
      const message = await this.chatService.sendMessage(client.user.id, sendMessageDto);
      
      this.logger.log(`Message envoyé par ${client.user.firstname} dans le chat ${sendMessageDto.chatId}`);

      // Diffuser le message à tous les participants du chat
      this.server.to(`chat_${sendMessageDto.chatId}`).emit('new_message', {
        message,
        timestamp: new Date(),
      });

      // Confirmer l'envoi au sender
      client.emit('message_sent', {
        message: 'Message envoyé avec succès',
        messageId: message.id,
      });

    } catch (error) {
      this.logger.error(`Erreur send_message: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('assign_chat')
  async handleAssignChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      if (!client.user) {
        throw new UnauthorizedException('Utilisateur non authentifié');
      }

      if (client.user.role !== Role.ADVISOR) {
        throw new UnauthorizedException('Seuls les advisors peuvent assigner des chats');
      }

      // Assigner le chat à l'advisor
      const chat = await this.chatService.assignAdvisorToChat(client.user.id, data.chatId);
      
      this.logger.log(`Chat ${data.chatId} assigné à l'advisor ${client.user.firstname}`);

      // Notifier tous les advisors que ce chat n'est plus disponible
      this.server.to('advisors').emit('chat_assigned', {
        chat,
        assignedTo: {
          id: client.user.id,
          firstname: client.user.firstname,
          lastname: client.user.lastname,
        },
      });

      // Notifier le client si il est connecté
      if (chat.client) {
        const clientSocketId = this.connectedUsers.get(chat.clientId);
        if (clientSocketId) {
          this.server.to(clientSocketId).emit('advisor_assigned', {
            message: `Un advisor a pris en charge votre chat`,
            advisor: {
              id: client.user.id,
              firstname: client.user.firstname,
              lastname: client.user.lastname,
            },
            chat,
          });
        }
      }

      // Confirmer l'assignation à l'advisor
      client.emit('chat_assignment_confirmed', {
        message: 'Chat assigné avec succès',
        chat,
      });

    } catch (error) {
      this.logger.error(`Erreur assign_chat: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('close_chat')
  async handleCloseChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      if (!client.user) {
        throw new UnauthorizedException('Utilisateur non authentifié');
      }

      if (client.user.role !== Role.ADVISOR) {
        throw new UnauthorizedException('Seuls les advisors peuvent fermer des chats');
      }

      // Fermer le chat
      const chat = await this.chatService.closeChat(client.user.id, data.chatId);
      
      this.logger.log(`Chat ${data.chatId} fermé par l'advisor ${client.user.firstname}`);

      // Notifier tous les participants du chat
      this.server.to(`chat_${data.chatId}`).emit('chat_closed', {
        message: 'Chat fermé par l\'advisor',
        chat,
        closedBy: {
          id: client.user.id,
          firstname: client.user.firstname,
          lastname: client.user.lastname,
        },
      });

    } catch (error) {
      this.logger.error(`Erreur close_chat: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('get_waiting_chats')
  async handleGetWaitingChats(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      if (!client.user) {
        throw new UnauthorizedException('Utilisateur non authentifié');
      }

      if (client.user.role !== Role.ADVISOR) {
        throw new UnauthorizedException('Seuls les advisors peuvent voir les chats en attente');
      }

      const waitingChats = await this.chatService.getWaitingChats();
      
      client.emit('waiting_chats', {
        chats: waitingChats,
      });

    } catch (error) {
      this.logger.error(`Erreur get_waiting_chats: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  // Méthode utilitaire pour notifier quand un nouveau chat est créé
  async notifyNewChatToAdvisors(chat: any) {
    this.server.to('advisors').emit('new_chat_waiting', {
      message: 'Nouveau chat en attente',
      chat,
    });
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // Extraire le token de l'autorisation ou des query params
    const authHeader = client.handshake.headers.authorization;
    const tokenFromQuery = client.handshake.query.token as string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    if (tokenFromQuery) {
      return tokenFromQuery;
    }
    
    return null;
  }
}
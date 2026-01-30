import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatStatus, Role } from 'src/generated/prisma/client';
import { CreateChatDto, SendMessageDto, ChatResponseDto, MessageResponseDto } from './dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prismaService: PrismaService
  ) {}

  private chatGateway: any;

  /**
   * Créer un nouveau chat (seuls les clients peuvent créer des chats)
   */
  async createChat(clientId: string, createChatDto: CreateChatDto): Promise<ChatResponseDto> {
    // Vérifier que l'utilisateur est un client
    const client = await this.prismaService.user.findUnique({
      where: { id: clientId },
    });

    if (!client || client.role !== Role.CLIENT) {
      throw new ForbiddenException('Seuls les clients peuvent créer des chats');
    }

    // Créer le chat
    const chat = await this.prismaService.chat.create({
      data: {
        status: ChatStatus.WAITING,
        subject: createChatDto.subject,
        clientId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    // Envoyer le message initial si fourni
    if (createChatDto.initialMessage) {
      await this.sendMessage(clientId, {
        chatId: chat.id,
        content: createChatDto.initialMessage,
      });
    }

    const formattedChat = this.formatChatResponse(chat);

    // Notifier les advisors qu'un nouveau chat est disponible
    try {
      if (this.chatGateway) {
        await this.chatGateway.notifyNewChatToAdvisors(formattedChat);
      }
    } catch (error) {
      console.warn('Failed to notify advisors of new chat:', error.message);
    }

    return formattedChat;
  }

  /**
   * Obtenir tous les chats d'un utilisateur
   */
  async getUserChats(userId: string, userRole: Role): Promise<ChatResponseDto[]> {
    const whereCondition = userRole === Role.CLIENT
      ? { clientId: userId }
      : userRole === Role.ADVISOR
      ? { advisorId: userId }
      : { OR: [{ clientId: userId }, { advisorId: userId }] };

    const chats = await this.prismaService.chat.findMany({
      where: whereCondition,
      include: {
        client: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        advisor: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chats.map(chat => this.formatChatResponse(chat));
  }

  /**
   * Obtenir un chat spécifique avec ses messages
   */
  async getChatById(chatId: string, userId: string): Promise<ChatResponseDto> {
    const chat = await this.prismaService.chat.findUnique({
      where: { id: chatId },
      include: {
        client: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        advisor: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat non trouvé');
    }

    // Vérifier que l'utilisateur a accès à ce chat
    if (chat.clientId !== userId && chat.advisorId !== userId) {
      throw new ForbiddenException('Accès non autorisé à ce chat');
    }

    return this.formatChatResponse(chat);
  }

  /**
   * Assigner un advisor à un chat (seuls les advisors peuvent faire cela)
   */
  async assignAdvisorToChat(advisorId: string, chatId: string): Promise<ChatResponseDto> {
    const advisor = await this.prismaService.user.findUnique({
      where: { id: advisorId },
    });

    if (!advisor || advisor.role !== Role.ADVISOR) {
      throw new ForbiddenException('Seuls les advisors peuvent prendre en charge des chats');
    }

    const chat = await this.prismaService.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat non trouvé');
    }

    if (chat.status !== ChatStatus.WAITING) {
      throw new BadRequestException('Ce chat n\'est pas en attente d\'assignation');
    }

    if (chat.advisorId && chat.advisorId !== advisorId) {
      throw new BadRequestException('Ce chat est déjà assigné à un autre advisor');
    }

    // Assigner l'advisor et changer le statut
    const updatedChat = await this.prismaService.chat.update({
      where: { id: chatId },
      data: {
        advisorId,
        status: ChatStatus.IN_PROGRESS,
      },
      include: {
        client: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        advisor: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    return this.formatChatResponse(updatedChat);
  }

  /**
   * Fermer un chat (seuls les advisors peuvent fermer des chats)
   */
  async closeChat(advisorId: string, chatId: string): Promise<ChatResponseDto> {
    const chat = await this.prismaService.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat non trouvé');
    }

    if (chat.advisorId !== advisorId) {
      throw new ForbiddenException('Seul l\'advisor assigné peut fermer ce chat');
    }

    if (chat.status === ChatStatus.CLOSED) {
      throw new BadRequestException('Ce chat est déjà fermé');
    }

    const updatedChat = await this.prismaService.chat.update({
      where: { id: chatId },
      data: { status: ChatStatus.CLOSED },
      include: {
        client: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        advisor: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    return this.formatChatResponse(updatedChat);
  }

  /**
   * Envoyer un message dans un chat
   */
  async sendMessage(authorId: string, sendMessageDto: SendMessageDto): Promise<MessageResponseDto> {
    const { chatId, content } = sendMessageDto;

    // Vérifier que le chat existe
    const chat = await this.prismaService.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat non trouvé');
    }

    // Vérifier que l'utilisateur peut envoyer un message dans ce chat
    if (chat.clientId !== authorId && chat.advisorId !== authorId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à envoyer des messages dans ce chat');
    }

    // Vérifier que le chat n'est pas fermé
    if (chat.status === ChatStatus.CLOSED) {
      throw new BadRequestException('Impossible d\'envoyer des messages dans un chat fermé');
    }

    // Créer le message
    const message = await this.prismaService.message.create({
      data: {
        content,
        chatId,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            role: true,
          },
        },
      },
    });

    // Mettre à jour la date de modification du chat (Prisma s'en occupe automatiquement avec @updatedAt)
    await this.prismaService.chat.update({
      where: { id: chatId },
      data: {}, // Trigger la mise à jour du updatedAt
    });

    return this.formatMessageResponse(message);
  }

  /**
   * Injecter le gateway pour éviter la dépendance circulaire
   */
  setChatGateway(gateway: any) {
    this.chatGateway = gateway;
  }

  /**
   * Obtenir les chats en attente (pour les advisors)
   */
  async getWaitingChats(): Promise<ChatResponseDto[]> {
    const chats = await this.prismaService.chat.findMany({
      where: { status: ChatStatus.WAITING },
      include: {
        client: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // Les plus anciens en premier
    });

    return chats.map(chat => this.formatChatResponse(chat));
  }

  /**
   * Formater la réponse du chat
   */
  private formatChatResponse(chat: any): ChatResponseDto {
    return {
      id: chat.id,
      status: chat.status,
      subject: chat.subject,
      clientId: chat.clientId,
      advisorId: chat.advisorId,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      client: chat.client,
      advisor: chat.advisor,
      messages: chat.messages?.map((msg: any) => this.formatMessageResponse(msg)),
    };
  }

  /**
   * Formater la réponse du message
   */
  private formatMessageResponse(message: any): MessageResponseDto {
    return {
      id: message.id,
      content: message.content,
      chatId: message.chatId,
      authorId: message.authorId,
      createdAt: message.createdAt,
      author: message.author,
    };
  }
}

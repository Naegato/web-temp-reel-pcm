import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { ApiOperation, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatDto, SendMessageDto } from './dto';
import { RoleAuthGuard } from 'src/auth/guard';
import { Roles } from 'src/auth/decorators';
import { Role } from 'src/generated/prisma/client';
import type { AuthRequestWithUser } from 'src/auth/types/auth-request.type';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(RoleAuthGuard)
  @Roles(Role.CLIENT)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau chat',
    description: 'Permet à un client de créer un nouveau chat avec un advisor.',
  })
  async createChat(
    @Request() req: AuthRequestWithUser,
    @Body() createChatDto: CreateChatDto,
  ) {
    return this.chatService.createChat(req.user.id, createChatDto);
  }

  @UseGuards(RoleAuthGuard)
  @Roles(Role.CLIENT, Role.ADVISOR)
  @Get('my-chats')
  @ApiOperation({
    summary: 'Obtenir mes chats',
    description: 'Récupère tous les chats de l\'utilisateur connecté.',
  })
  async getMyChats(@Request() req: AuthRequestWithUser) {
    return this.chatService.getUserChats(req.user.id, req.user.role);
  }

  @UseGuards(RoleAuthGuard)
  @Roles(Role.ADVISOR)
  @Get('waiting')
  @ApiOperation({
    summary: 'Obtenir les chats en attente',
    description: 'Récupère tous les chats en attente d\'assignation (pour les advisors).',
  })
  async getWaitingChats() {
    return this.chatService.getWaitingChats();
  }

  @UseGuards(RoleAuthGuard)
  @Roles(Role.CLIENT, Role.ADVISOR)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir un chat spécifique',
    description: 'Récupère un chat avec tous ses messages.',
  })
  async getChatById(
    @Param('id') chatId: string,
    @Request() req: AuthRequestWithUser,
  ) {
    return this.chatService.getChatById(chatId, req.user.id);
  }

  @UseGuards(RoleAuthGuard)
  @Roles(Role.ADVISOR)
  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'S\'assigner un chat',
    description: 'Permet à un advisor de prendre en charge un chat en attente.',
  })
  async assignChatToMe(
    @Param('id') chatId: string,
    @Request() req: AuthRequestWithUser,
  ) {
    return this.chatService.assignAdvisorToChat(req.user.id, chatId);
  }

  @UseGuards(RoleAuthGuard)
  @Roles(Role.ADVISOR)
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fermer un chat',
    description: 'Permet à un advisor de fermer un chat qu\'il a en charge.',
  })
  async closeChat(
    @Param('id') chatId: string,
    @Request() req: AuthRequestWithUser,
  ) {
    return this.chatService.closeChat(req.user.id, chatId);
  }

  @UseGuards(RoleAuthGuard)
  @Roles(Role.CLIENT, Role.ADVISOR)
  @Post('message')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Envoyer un message',
    description: 'Envoie un message dans un chat (via API REST, pour les cas où WebSocket n\'est pas disponible).',
  })
  async sendMessage(
    @Request() req: AuthRequestWithUser,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }
}

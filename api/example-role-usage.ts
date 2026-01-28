/**
 * EXEMPLE D'UTILISATION DU SYSTÈME DE RÔLES
 * 
 * Ce fichier montre comment utiliser le RoleAuthGuard dans vos contrôleurs.
 * 
 * ⚠️  IMPORTANT: Ce fichier est un exemple et ne doit pas être utilisé en production.
 *     Supprimez ce fichier avant le déploiement.
 */

import { Controller, Get, Post, UseGuards, Request, Body } from '@nestjs/common';
import { RoleAuthGuard, AuthGuard } from './src/auth/guard';
import { Roles } from './src/auth/decorators';
import { Role } from './src/generated/prisma/client';
import type { AuthRequestWithUser } from './src/auth/types/auth-request.type';

@Controller('example')
export class ExampleRoleController {
  
  // ========================================
  // ENDPOINT PUBLIC (aucune protection)
  // ========================================
  @Get('public')
  async publicEndpoint() {
    return { message: 'Accessible à tous, aucune authentification requise' };
  }
  
  // ========================================
  // AUTHENTIFICATION SIMPLE (tous les utilisateurs connectés)
  // ========================================
  @UseGuards(AuthGuard)
  @Get('authenticated')
  async authenticatedEndpoint(@Request() req: AuthRequestWithUser) {
    return { 
      message: `Bonjour ${req.user.firstname}!`,
      userRole: req.user.role,
      userId: req.user.id
    };
  }
  
  // ========================================
  // RÔLE ADVISOR SEULEMENT
  // ========================================
  @UseGuards(RoleAuthGuard)
  @Roles(Role.ADVISOR)
  @Get('advisor-only')
  async advisorOnlyEndpoint(@Request() req: AuthRequestWithUser) {
    return { 
      message: `Dashboard advisor pour ${req.user.firstname} ${req.user.lastname}`,
      advisorId: req.user.id
    };
  }
  
  @UseGuards(RoleAuthGuard)
  @Roles(Role.ADVISOR)
  @Post('close-chat')
  async closeChatEndpoint(@Request() req: AuthRequestWithUser, @Body() body: { chatId: string }) {
    return { 
      message: `Chat ${body.chatId} fermé par l'advisor ${req.user.firstname}`,
      advisorId: req.user.id
    };
  }
  
  // ========================================
  // RÔLE CLIENT SEULEMENT
  // ========================================
  @UseGuards(RoleAuthGuard)
  @Roles(Role.CLIENT)
  @Get('client-only')
  async clientOnlyEndpoint(@Request() req: AuthRequestWithUser) {
    return { 
      message: `Espace client pour ${req.user.firstname} ${req.user.lastname}`,
      clientId: req.user.id
    };
  }
  
  @UseGuards(RoleAuthGuard)
  @Roles(Role.CLIENT)
  @Post('create-chat')
  async createChatEndpoint(@Request() req: AuthRequestWithUser) {
    return { 
      message: `Nouveau chat créé par le client ${req.user.firstname}`,
      clientId: req.user.id
    };
  }
  
  // ========================================
  // PLUSIEURS RÔLES AUTORISÉS
  // ========================================
  @UseGuards(RoleAuthGuard)
  @Roles(Role.CLIENT, Role.ADVISOR)
  @Post('send-message')
  async sendMessageEndpoint(@Request() req: AuthRequestWithUser, @Body() body: { message: string }) {
    return { 
      message: `Message envoyé par ${req.user.role.toLowerCase()} ${req.user.firstname}`,
      content: body.message,
      senderId: req.user.id,
      senderRole: req.user.role
    };
  }
  
  @UseGuards(RoleAuthGuard)
  @Roles(Role.CLIENT, Role.ADVISOR)
  @Get('my-profile')
  async getMyProfileEndpoint(@Request() req: AuthRequestWithUser) {
    return {
      profile: {
        id: req.user.id,
        email: req.user.email,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        role: req.user.role,
        isActive: req.user.isActive,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
        // Note: le password n'est pas disponible (sécurité)
      }
    };
  }
}

/* 
EXEMPLES DE TESTS AVEC CURL:

1. Endpoint public:
curl -X GET http://localhost:3000/example/public

2. Endpoint authentifié (nécessite un token valide):
curl -X GET http://localhost:3000/example/authenticated \
  -H "Authorization: Bearer YOUR_TOKEN"

3. Endpoint advisor seulement:
curl -X GET http://localhost:3000/example/advisor-only \
  -H "Authorization: Bearer ADVISOR_TOKEN"

4. Endpoint client seulement:
curl -X GET http://localhost:3000/example/client-only \
  -H "Authorization: Bearer CLIENT_TOKEN"

5. Endpoint multi-rôles:
curl -X POST http://localhost:3000/example/send-message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello world!"}'

RÉPONSES D'ERREUR:

- Token manquant ou invalide (401):
{
  "statusCode": 401,
  "message": "Unauthorized"
}

- Rôle insuffisant (403):
{
  "statusCode": 403,
  "message": "Access denied. Required roles: ADVISOR. Your role: CLIENT"
}
*/
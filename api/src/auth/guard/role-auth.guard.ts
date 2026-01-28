import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthGuard } from './auth.guard';
import { UsersService } from 'src/users/users.service';
import type { AuthRequestWithUser } from '../types/auth-request.type';

@Injectable()
export class RoleAuthGuard extends AuthGuard implements CanActivate {
  constructor(
    jwtService: JwtService,
    usersService: UsersService,
    private reflector: Reflector,
  ) {
    super(jwtService, usersService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // D'abord, vérifier l'authentification avec AuthGuard
    const isAuthenticated = await super.canActivate(context);
    
    if (!isAuthenticated) {
      return false;
    }

    // Récupérer les rôles requis depuis les métadonnées
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si aucun rôle n'est spécifié, l'accès est autorisé après authentification
    if (!requiredRoles) {
      return true;
    }

    // Récupérer l'utilisateur depuis la requête
    const request: AuthRequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    // Vérifier si l'utilisateur a l'un des rôles requis
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
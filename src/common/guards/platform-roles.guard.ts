import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLATFORM_ROLES_KEY } from '../decorators/platform-roles.decorator';

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      PLATFORM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const platformUser = request.platformUser;

    if (!platformUser) {
      throw new ForbiddenException('Platform user not found in request');
    }

    const hasRequiredRole = requiredRoles.some((role) =>
      platformUser.roles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}

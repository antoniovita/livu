import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    let payload: { sub: string };

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const platformUser = await this.prisma.platformUser.findUnique({
      where: { id: payload.sub },
      include: {
        roles: true,
      },
    });

    if (!platformUser) {
      throw new UnauthorizedException('Platform user not found');
    }

    if (platformUser.status !== 'ACTIVE') {
      throw new UnauthorizedException('Platform user is inactive');
    }

    request.platformUser = {
      id: platformUser.id,
      name: platformUser.name,
      email: platformUser.email,
      status: platformUser.status,
      roles: platformUser.roles.map((role) => role.role),
    };

    return true;
  }
}

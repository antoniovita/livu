import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddUserMembershipDto } from './dto/add-user-membership.dto';
import { SetPrimaryMembershipDto } from './dto/set-primary-membership.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(condominiumId: string) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        condominiums: {
          some: {
            condominiumId,
          },
        },
      },
    });
  }

  async listById(userId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
  }

  async listAllSoftDeleted(condominiumId: string) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: {
          not: null,
        },
        condominiums: {
          some: {
            condominiumId,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }

  async create(dto: CreateUserDto) {
    await this.ensureUnitBelongsToCondominium(dto.condominiumId, dto.unitId);

    return this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        status: 'ACTIVE',
        condominiums: {
          create: {
            condominiumId: dto.condominiumId,
            unitId: dto.unitId,
            isPrimary: true,
          },
        },
      },
    });
  }

  async addMembership(userId: string, dto: AddUserMembershipDto) {
    await this.ensureUserExists(userId);
    await this.ensureUnitBelongsToCondominium(dto.condominiumId, dto.unitId);

    if (dto.isPrimary) {
      await this.unsetPrimaryMemberships(userId, dto.condominiumId);
    }

    return this.prisma.userCondominium.upsert({
      where: {
        userId_condominiumId_unitId: {
          userId,
          condominiumId: dto.condominiumId,
          unitId: dto.unitId,
        },
      },
      create: {
        userId,
        condominiumId: dto.condominiumId,
        unitId: dto.unitId,
        isPrimary: dto.isPrimary ?? false,
      },
      update: {
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  async update(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      data: dto,
      where: { id: userId },
    });
  }

  async softDelete(userId: string) {
    return this.prisma.user.update({
      data: {
        deletedAt: new Date(),
      },
      where: { id: userId },
    });
  }

  async restore(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.deletedAt) {
      throw new NotFoundException('User not found or not deleted');
    }

    return this.prisma.user.update({
      data: {
        deletedAt: null,
      },
      where: { id: userId },
    });
  }

  async clearTrash(condominiumId: string) {
    return this.prisma.user.deleteMany({
      where: {
        deletedAt: {
          not: null,
        },
        condominiums: {
          some: {
            condominiumId,
          },
        },
      },
    });
  }

  async removeMembership(userId: string, condominiumId: string, unitId: string) {
    return this.prisma.userCondominium.delete({
      where: {
        userId_condominiumId_unitId: {
          userId,
          condominiumId,
          unitId,
        },
      },
    });
  }

  async setPrimaryMembership(userId: string, dto: SetPrimaryMembershipDto) {
    await this.ensureUserExists(userId);
    await this.ensureUnitBelongsToCondominium(dto.condominiumId, dto.unitId);

    await this.unsetPrimaryMemberships(userId, dto.condominiumId);

    return this.prisma.userCondominium.update({
      where: {
        userId_condominiumId_unitId: {
          userId,
          condominiumId: dto.condominiumId,
          unitId: dto.unitId,
        },
      },
      data: {
        isPrimary: true,
      },
    });
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async ensureUnitBelongsToCondominium(condominiumId: string, unitId: string) {
    const condominium = await this.prisma.condominium.findUnique({
      where: { id: condominiumId },
    });

    if (!condominium) {
      throw new NotFoundException('Condominium not found');
    }

    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (unit.condominiumId !== condominiumId) {
      throw new NotFoundException('Unit does not belong to the condominium');
    }
  }

  private async unsetPrimaryMemberships(userId: string, condominiumId: string) {
    await this.prisma.userCondominium.updateMany({
      where: {
        userId,
        condominiumId,
      },
      data: {
        isPrimary: false,
      },
    });
  }
}

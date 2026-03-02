import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSpaceDto } from './dto/create-space.dto';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(condominiumId: string) {
    return this.prisma.space.findMany({
      where: {
        condominiumId,
        deletedAt: null,
      },
    });
  }

  async listById(spaceId: string) {
    return this.prisma.space.findFirst({
      where: {
        id: spaceId,
        deletedAt: null,
      },
    });
  }

  async listAllSoftDeleted(condominiumId: string) {
    return this.prisma.space.findMany({
      where: {
        condominiumId,
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }

  async create(dto: CreateSpaceDto) {
    return this.prisma.space.create({
      data: dto,
    });
  }

  async update(spaceId: string, dto: UpdateSpaceDto) {
    return this.prisma.space.update({
      data: dto,
      where: { id: spaceId },
    });
  }

  async softDelete(spaceId: string) {
    return this.prisma.space.update({
      data: {
        deletedAt: new Date(),
      },
      where: { id: spaceId },
    });
  }

  async permanentlyDelete(spaceId: string) {
    return this.prisma.space.delete({
      where: { id: spaceId },
    });
  }

  async restore(spaceId: string) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space || !space.deletedAt) {
      throw new NotFoundException('Space not found or not deleted');
    }

    return this.prisma.space.update({
      data: {
        deletedAt: null,
      },
      where: { id: spaceId },
    });
  }

  async clearTrash(condominiumId: string) {
    return this.prisma.space.deleteMany({
      where: {
        condominiumId,
        deletedAt: {
          not: null,
        },
      },
    });
  }

}

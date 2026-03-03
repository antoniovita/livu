import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll() {
    return this.prisma.client.findMany({
      where: {
        status: 'ACTIVE',
      },
    });
  }

  async listById(clientId: string) {
    return this.prisma.client.findFirst({
      where: {
        id: clientId,
        status: 'ACTIVE',
      },
    });
  }

  async listAllInactive() {
    return this.prisma.client.findMany({
      where: {
        status: 'INACTIVE',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({
      data: dto,
    });
  }

  async update(clientId: string, dto: UpdateClientDto) {
    return this.prisma.client.update({
      where: { id: clientId },
      data: dto,
    });
  }

  async deactivateAccount(clientId: string) {
    return this.prisma.client.update({
      where: { id: clientId },
      data: {
        status: 'INACTIVE',
      },
    });
  }

  async reactivateAccount(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client || client.status !== 'INACTIVE') {
      throw new NotFoundException('Client not found or not inactive');
    }

    return this.prisma.client.update({
      where: { id: clientId },
      data: {
        status: 'ACTIVE',
      },
    });
  }
}

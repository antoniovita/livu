import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(condominiumId: string) {
    return this.prisma.package.findMany({
      where: {
        condominiumId,
        deletedAt: null,
      },
    });
  }

  async listById(packageId: string) {
    return this.prisma.package.findFirst({
      where: {
        id: packageId,
        deletedAt: null,
      },
    });
  }

  async listAllSoftDeleted(condominiumId: string) {
    return this.prisma.package.findMany({
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

  async create(dto: CreatePackageDto) {
    return this.prisma.package.create({
      data: {
        ...dto,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : undefined,
        pickedUpAt: dto.pickedUpAt ? new Date(dto.pickedUpAt) : undefined,
      },
    });
  }

  async update(packageId: string, dto: UpdatePackageDto) {
    return this.prisma.package.update({
      where: { id: packageId },
      data: {
        ...dto,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : undefined,
        pickedUpAt: dto.pickedUpAt ? new Date(dto.pickedUpAt) : undefined,
      },
    });
  }

  async softDelete(packageId: string) {
    return this.prisma.package.update({
      where: { id: packageId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async permanentlyDelete(packageId: string) {
    return this.prisma.package.delete({
      where: { id: packageId },
    });
  }

  async restore(packageId: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg || !pkg.deletedAt) {
      throw new NotFoundException('Package not found or not deleted');
    }

    return this.prisma.package.update({
      where: { id: packageId },
      data: {
        deletedAt: null,
      },
    });
  }

  async clearTrash(condominiumId: string) {
    return this.prisma.package.deleteMany({
      where: {
        condominiumId,
        deletedAt: {
          not: null,
        },
      },
    });
  }
}

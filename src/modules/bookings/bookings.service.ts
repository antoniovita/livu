import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(condominiumId: string) {
    return this.prisma.booking.findMany({
      where: {
        condominiumId,
        deletedAt: null,
      },
    });
  }

  async listById(bookingId: string) {
    return this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        deletedAt: null,
      },
    });
  }

  async listByUnit(unitId: string) {
    return this.prisma.booking.findMany({
      where: {
        unitId,
        deletedAt: null,
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  async listAllSoftDeleted(condominiumId: string) {
    return this.prisma.booking.findMany({
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

  async create(dto: CreateBookingDto) {
    return this.prisma.booking.create({
      data: {
        ...dto,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
      },
    });
  }

  async update(bookingId: string, dto: UpdateBookingDto) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...dto,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
      },
    });
  }

  async softDelete(bookingId: string) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async permanentlyDelete(bookingId: string) {
    return this.prisma.booking.delete({
      where: { id: bookingId },
    });
  }

  async restore(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || !booking.deletedAt) {
      throw new NotFoundException('Booking not found or not deleted');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        deletedAt: null,
      },
    });
  }

  async clearTrash(condominiumId: string) {
    return this.prisma.booking.deleteMany({
      where: {
        condominiumId,
        deletedAt: {
          not: null,
        },
      },
    });
  }
}

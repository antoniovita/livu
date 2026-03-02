import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateWhatsAppChannelDto } from './dto/create-whatsapp-channel.dto';
import { UpdateWhatsAppChannelDto } from './dto/update-whatsapp-channel.dto';

@Injectable()
export class WhatsappChannelService {
  constructor(private readonly prisma: PrismaService) {}

  listChannels() {
    return this.prisma.whatsAppChannel.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createChannel(dto: CreateWhatsAppChannelDto) {
    await this.ensureCondominiumExists(dto.condominiumId);

    const existingChannel = await this.prisma.whatsAppChannel.findUnique({
      where: {
        condominiumId: dto.condominiumId,
      },
    });

    if (existingChannel) {
      throw new ConflictException('Condominium already has a WhatsApp channel');
    }

    return this.prisma.whatsAppChannel.create({
      data: dto,
    });
  }

  async updateChannel(channelId: string, dto: UpdateWhatsAppChannelDto) {
    return this.prisma.whatsAppChannel.update({
      where: { id: channelId },
      data: dto,
    });
  }

  async getActiveChannelByKey(channelKey: string) {
    const channel = await this.prisma.whatsAppChannel.findUnique({
      where: { channelKey },
    });

    if (!channel || channel.status !== 'ACTIVE') {
      throw new NotFoundException('WhatsApp channel not found or inactive');
    }

    return channel;
  }

  async validateChannelSignature(channelKey: string, signature?: string) {
    const channel = await this.getActiveChannelByKey(channelKey);

    if (channel.webhookSecret && channel.webhookSecret !== signature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return channel;
  }

  private async ensureCondominiumExists(condominiumId: string) {
    const condominium = await this.prisma.condominium.findUnique({
      where: { id: condominiumId },
    });

    if (!condominium) {
      throw new NotFoundException('Condominium not found');
    }
  }
}

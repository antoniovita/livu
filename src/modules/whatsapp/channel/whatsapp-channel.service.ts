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
    if ((dto.status ?? 'ACTIVE') === 'ACTIVE' && (await this.hasActiveGlobalChannel())) {
      throw new ConflictException('An active global WhatsApp channel already exists');
    }

    return this.prisma.whatsAppChannel.create({
      data: dto,
    });
  }

  async updateChannel(channelId: string, dto: UpdateWhatsAppChannelDto) {
    if (dto.status === 'ACTIVE') {
      const activeChannel = await this.prisma.whatsAppChannel.findFirst({
        where: {
          status: 'ACTIVE',
          id: {
            not: channelId,
          },
        },
      });

      if (activeChannel) {
        throw new ConflictException('An active global WhatsApp channel already exists');
      }
    }

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

  private async hasActiveGlobalChannel() {
    const activeChannel = await this.prisma.whatsAppChannel.findFirst({
      where: {
        status: 'ACTIVE',
      },
    });

    return Boolean(activeChannel);
  }
}

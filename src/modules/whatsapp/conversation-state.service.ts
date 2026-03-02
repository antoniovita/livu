import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';

const CONVERSATION_TTL_MINUTES = 30;

@Injectable()
export class ConversationStateService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateActiveContext(
    channelId: string,
    condominiumId: string,
    phone: string,
  ) {
    const now = new Date();

    const context = await this.prisma.conversationContext.findFirst({
      where: {
        channelId,
        phone,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (context) {
      return context;
    }

    return this.prisma.conversationContext.create({
      data: {
        channelId,
        condominiumId,
        phone,
        state: 'IDLE',
        contextJson: {},
        expiresAt: this.buildExpirationDate(now),
        lastInboundAt: now,
      },
    });
  }

  async touchInbound(contextId: string) {
    return this.prisma.conversationContext.update({
      where: { id: contextId },
      data: {
        lastInboundAt: new Date(),
        expiresAt: this.buildExpirationDate(),
      },
    });
  }

  async touchOutbound(contextId: string) {
    return this.prisma.conversationContext.update({
      where: { id: contextId },
      data: {
        lastOutboundAt: new Date(),
        expiresAt: this.buildExpirationDate(),
      },
    });
  }

  async updateContext(
    contextId: string,
    data: {
      state?: string;
      userId?: string | null;
      selectedUnitId?: string | null;
      contextJson?: Record<string, unknown>;
    },
  ) {
    return this.prisma.conversationContext.update({
      where: { id: contextId },
      data: {
        state: data.state,
        userId: data.userId,
        selectedUnitId: data.selectedUnitId ?? null,
        contextJson: data.contextJson,
        expiresAt: this.buildExpirationDate(),
      },
    });
  }

  async resetContext(contextId: string) {
    return this.prisma.conversationContext.update({
      where: { id: contextId },
      data: {
        userId: null,
        selectedUnitId: null,
        state: 'IDLE',
        contextJson: {},
        expiresAt: this.buildExpirationDate(),
      },
    });
  }

  async listContexts(filters: {
    channelId?: string;
    condominiumId?: string;
    phone?: string;
    state?: string;
    activeOnly?: boolean;
  }) {
    return this.prisma.conversationContext.findMany({
      where: {
        channelId: filters.channelId,
        condominiumId: filters.condominiumId,
        phone: filters.phone,
        state: filters.state,
        ...(filters.activeOnly
          ? {
              expiresAt: {
                gt: new Date(),
              },
            }
          : {}),
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  private buildExpirationDate(baseDate = new Date()) {
    return new Date(baseDate.getTime() + CONVERSATION_TTL_MINUTES * 60 * 1000);
  }
}

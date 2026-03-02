import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NormalizedInboundMessageDto } from '../dto/normalized-inbound-message.dto';

@Injectable()
export class WhatsAppProviderService {
  validateSignature(secret: string, signature?: string) {
    if (!secret) {
      return true;
    }

    return signature === secret;
  }

  parseWebhook(
    channelKey: string,
    payload: Record<string, any>,
  ): NormalizedInboundMessageDto[] {
    const rawMessages = Array.isArray(payload.messages)
      ? payload.messages
      : payload.message
        ? [payload.message]
        : [payload];

    return rawMessages.map((message, index) => ({
      channelKey,
      providerMessageId:
        message.providerMessageId ??
        message.id ??
        `${channelKey}-${Date.now()}-${index}`,
      phone: message.phone ?? payload.phone ?? '',
      messageType: message.messageType ?? message.type ?? 'text',
      text: message.text ?? message.body ?? payload.text,
      interactiveReplyId:
        message.interactiveReplyId ?? message.replyId ?? payload.interactiveReplyId,
      sentAt: message.sentAt ? new Date(message.sentAt) : new Date(),
      rawPayload: message,
    }));
  }

  async sendText(_: {
    channelKey: string;
    phone: string;
    text: string;
  }) {
    return {
      providerMessageId: randomUUID(),
      status: 'SENT',
    };
  }

  async sendInteractive(_: {
    channelKey: string;
    phone: string;
    text: string;
    options: Array<{ id: string; title: string }>;
  }) {
    return {
      providerMessageId: randomUUID(),
      status: 'SENT',
    };
  }
}

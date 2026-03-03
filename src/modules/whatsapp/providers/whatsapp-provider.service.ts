import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NormalizedInboundMessageDto } from '../channel/dto/normalized-inbound-message.dto';

@Injectable()
export class WhatsAppProviderService {
  // Converts provider-specific webhook payloads into one internal message shape.
  parseWebhook(
    channelKey: string,
    payload: Record<string, any>,
  ): NormalizedInboundMessageDto[] {
    const sourceMessages = Array.isArray(payload.messages)
      ? payload.messages
      : payload.message
        ? [payload.message]
        : [payload];

    return sourceMessages.map((message) => ({
      channelKey,
      providerMessageId: String(
        message.providerMessageId ?? message.id ?? message.messageId ?? randomUUID(),
      ),
      phone: String(message.phone ?? message.from ?? message.sender ?? ''),
      messageType: String(message.messageType ?? message.type ?? 'text'),
      text: message.text ?? message.body ?? message.content,
      interactiveReplyId: message.interactiveReplyId ?? message.replyId,
      sentAt: String(message.sentAt ?? message.timestamp ?? new Date().toISOString()),
      rawPayload: message,
    }));
  }

  // Initial implementation is a stub; later this can call the real provider SDK/API.
  async sendText(_: { channelKey: string; phone: string; text: string }) {
    return {
      providerMessageId: randomUUID(),
      status: 'SENT',
    };
  }
}

export class NormalizedInboundMessageDto {
  channelKey: string;
  providerMessageId: string;
  phone: string;
  messageType: string;
  text?: string;
  interactiveReplyId?: string;
  sentAt: Date;
  rawPayload?: Record<string, unknown>;
}

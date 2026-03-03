export class NormalizedInboundMessageDto {
  channelKey: string;
  providerMessageId: string;
  phone: string;
  messageType: string;
  text?: string;
  interactiveReplyId?: string;
  sentAt: string;
  rawPayload: Record<string, any>;
}

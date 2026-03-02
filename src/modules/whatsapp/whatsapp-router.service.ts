import { Injectable } from '@nestjs/common';
import { NormalizedInboundMessageDto } from './dto/normalized-inbound-message.dto';
import { ConversationStateService } from './conversation-state.service';
import { IdentityResolutionService } from './identity-resolution.service';
import { IntentDispatcherService } from './intent-dispatcher.service';
import { WhatsappChannelService } from './whatsapp-channel.service';
import { WhatsAppProviderService } from './providers/whatsapp-provider.service';

@Injectable()
export class WhatsappRouterService {
  constructor(
    private readonly channelService: WhatsappChannelService,
    private readonly conversationState: ConversationStateService,
    private readonly identityResolution: IdentityResolutionService,
    private readonly intentDispatcher: IntentDispatcherService,
    private readonly provider: WhatsAppProviderService,
  ) {}

  async handleWebhook(channelKey: string, payload: Record<string, any>, signature?: string) {
    const channel = await this.channelService.validateChannelSignature(channelKey, signature);
    const messages = this.provider.parseWebhook(channelKey, payload);

    const results: Array<Record<string, unknown>> = [];

    for (const message of messages) {
      results.push(await this.handleInboundMessage(channel, message));
    }

    return {
      accepted: true,
      processed: results.length,
      results,
    };
  }

  private async handleInboundMessage(channel: any, message: NormalizedInboundMessageDto) {
    const normalizedPhone = this.identityResolution.normalizePhone(message.phone);
    const context = await this.conversationState.getOrCreateActiveContext(
      channel.id,
      channel.condominiumId,
      normalizedPhone,
    );

    await this.conversationState.touchInbound(context.id);

    const identity = await this.identityResolution.resolve(channel.condominiumId, normalizedPhone, {
      userId: context.userId,
      unitId: context.selectedUnitId,
    });

    const outcome = await this.intentDispatcher.dispatch({
      channelDisplayName: channel.displayName,
      condominiumId: channel.condominiumId,
      inboundText: message.text,
      interactiveReplyId: message.interactiveReplyId,
      contextState: context.state,
      contextJson: (context.contextJson as Record<string, unknown> | null) ?? {},
      identity,
    });

    const updatedContext = await this.conversationState.updateContext(context.id, {
      state: outcome.state,
      userId: outcome.userId ?? identity.userId ?? null,
      selectedUnitId:
        outcome.selectedUnitId === null
          ? null
          : outcome.selectedUnitId ?? identity.unitId ?? null,
      contextJson: outcome.contextJson ?? {},
    });

    await this.provider.sendText({
      channelKey: channel.channelKey,
      phone: normalizedPhone,
      text: outcome.text,
    });

    await this.conversationState.touchOutbound(updatedContext.id);

    return {
      deduplicated: false,
      providerMessageId: message.providerMessageId,
      state: updatedContext.state,
    };
  }
}

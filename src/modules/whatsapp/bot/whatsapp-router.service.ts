import { Injectable } from '@nestjs/common';
import { normalizePhone } from 'src/common/utils/phone.util';
import { NormalizedInboundMessageDto } from '../channel/dto/normalized-inbound-message.dto';
import { ConversationStateService } from './conversation-state.service';
import { IdentityResolutionService } from './identity-resolution.service';
import { IntentDispatcherService } from './intent-dispatcher.service';
import { WhatsappChannelService } from '../channel/whatsapp-channel.service';
import { WhatsAppProviderService } from '../providers/whatsapp-provider.service';

@Injectable()
export class WhatsappRouterService {
  constructor(
    private readonly channelService: WhatsappChannelService,
    private readonly conversationState: ConversationStateService,
    private readonly identityResolution: IdentityResolutionService,
    private readonly intentDispatcher: IntentDispatcherService,
    private readonly provider: WhatsAppProviderService,
  ) {}

  // Entry point used by the webhook controller after the raw HTTP request is accepted.
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

  // Orchestrates one inbound message from normalization until the outbound reply.
  private async handleInboundMessage(channel: any, message: NormalizedInboundMessageDto) {
    const normalizedPhone = normalizePhone(message.phone);

    // Conversations are scoped by channel + phone because the number is global.
    const context = await this.conversationState.getOrCreateActiveContext(
      channel.id,
      normalizedPhone,
    );

    await this.conversationState.touchInbound(context.id);

    const identity = await this.identityResolution.resolve(normalizedPhone, {
      userId: context.userId,
      condominiumId: context.condominiumId,
      selectedUnitId: context.selectedUnitId,
    });

    const outcome = await this.intentDispatcher.dispatch({
      inboundText: message.text,
      interactiveReplyId: message.interactiveReplyId,
      contextState: context.state,
      contextJson: (context.contextJson as Record<string, unknown> | null) ?? {},
      identity,
    });

    let updatedContext = await this.conversationState.updateContext(context.id, {
      state: outcome.state,
      userId: outcome.userId ?? identity.userId ?? null,
      condominiumId:
        outcome.condominiumId === undefined
          ? identity.condominiumId ?? null
          : outcome.condominiumId,
      selectedUnitId:
        outcome.selectedUnitId === undefined
          ? identity.unitId ?? null
          : outcome.selectedUnitId,
      contextJson: outcome.contextJson ?? {},
    });

    let responseText = outcome.text;

    // After selecting the condominium we can often resolve the unit immediately.
    if (outcome.condominiumId && outcome.selectedUnitId === null) {
      const identityAfterCondominiumSelection = await this.identityResolution.resolve(
        normalizedPhone,
        {
          userId: updatedContext.userId,
          condominiumId: outcome.condominiumId,
          selectedUnitId: null,
        },
      );

      const followUpOutcome = await this.intentDispatcher.dispatch({
        contextState: updatedContext.state,
        contextJson: (updatedContext.contextJson as Record<string, unknown> | null) ?? {},
        identity: identityAfterCondominiumSelection,
      });

      updatedContext = await this.conversationState.updateContext(context.id, {
        state: followUpOutcome.state,
        userId: followUpOutcome.userId ?? identityAfterCondominiumSelection.userId ?? null,
        condominiumId:
          followUpOutcome.condominiumId === undefined
            ? identityAfterCondominiumSelection.condominiumId ?? null
            : followUpOutcome.condominiumId,
        selectedUnitId:
          followUpOutcome.selectedUnitId === undefined
            ? identityAfterCondominiumSelection.unitId ?? null
            : followUpOutcome.selectedUnitId,
        contextJson: followUpOutcome.contextJson ?? {},
      });

      responseText = `${outcome.text}\n\n${followUpOutcome.text}`;
    }

    await this.provider.sendText({
      channelKey: channel.channelKey,
      phone: normalizedPhone,
      text: responseText,
    });

    await this.conversationState.touchOutbound(updatedContext.id);

    return {
      providerMessageId: message.providerMessageId,
      state: updatedContext.state,
    };
  }
}

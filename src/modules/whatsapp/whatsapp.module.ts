import { Module } from '@nestjs/common';
import { WhatsappWebhooksController } from './whatsapp-webhooks.controller';
import { WhatsappChannelsController } from './whatsapp-channels.controller';
import { BotAdminController } from './bot-admin.controller';
import { WhatsappChannelService } from './whatsapp-channel.service';
import { ConversationStateService } from './conversation-state.service';
import { IdentityResolutionService } from './identity-resolution.service';
import { IntentDispatcherService } from './intent-dispatcher.service';
import { WhatsappRouterService } from './whatsapp-router.service';
import { WhatsAppProviderService } from './providers/whatsapp-provider.service';

@Module({
  controllers: [
    WhatsappWebhooksController,
    WhatsappChannelsController,
    BotAdminController,
  ],
  providers: [
    WhatsappChannelService,
    ConversationStateService,
    IdentityResolutionService,
    IntentDispatcherService,
    WhatsappRouterService,
    WhatsAppProviderService,
  ],
  exports: [WhatsappChannelService, WhatsappRouterService],
})
export class WhatsappModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { BotAdminController } from './bot/bot-admin.controller';
import { WhatsappChannelsController } from './channel/whatsapp-channels.controller';
import { WhatsappWebhooksController } from './whatsapp-webhook.controller';
import { ConversationStateService } from './bot/conversation-state.service';
import { IdentityResolutionService } from './identity-resolution.service';
import { IntentDispatcherService } from './intent-dispatcher.service';
import { WhatsAppProviderService } from './providers/whatsapp-provider.service';
import { WhatsappChannelService } from './channel/whatsapp-channel.service';
import { WhatsappRouterService } from './bot/whatsapp-router.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    BotAdminController,
    WhatsappChannelsController,
    WhatsappWebhooksController,
  ],
  providers: [
    ConversationStateService,
    IdentityResolutionService,
    IntentDispatcherService,
    WhatsAppProviderService,
    WhatsappChannelService,
    WhatsappRouterService,
  ],
  exports: [WhatsappChannelService, WhatsappRouterService],
})
export class WhatsappModule {}

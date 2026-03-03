import { Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ConversationStateService } from './conversation-state.service';
import { ConversationQueryDto } from '../channel/dto/conversation-query.dto';

@Controller('bot')
export class BotAdminController {
  constructor(private readonly conversationState: ConversationStateService) {}

  @Get('conversations')
  listConversations(@Query() query: ConversationQueryDto) {
    return this.conversationState.listContexts({
      channelId: query.channelId,
      condominiumId: query.condominiumId,
      phone: query.phone,
      state: query.state,
      activeOnly: query.activeOnly === 'true',
    });
  }

  @Post('conversations/:conversationId/reset')
  resetConversation(
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
  ) {
    return this.conversationState.resetContext(conversationId);
  }
}

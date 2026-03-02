import { Body, Controller, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { WhatsappRouterService } from './whatsapp-router.service';

@Controller('webhooks/whatsapp')
export class WhatsappWebhooksController {
  constructor(private readonly routerService: WhatsappRouterService) {}

  @Post(':channelKey')
  @HttpCode(200)
  handleWebhook(
    @Param('channelKey') channelKey: string,
    @Headers('x-webhook-secret') signature: string | undefined,
    @Body() payload: Record<string, any>,
  ) {
    return this.routerService.handleWebhook(channelKey, payload, signature);
  }
}

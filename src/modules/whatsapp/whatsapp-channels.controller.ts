import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { WhatsappChannelService } from './whatsapp-channel.service';
import { CreateWhatsAppChannelDto } from './dto/create-whatsapp-channel.dto';
import { UpdateWhatsAppChannelDto } from './dto/update-whatsapp-channel.dto';

@Controller('whatsapp/channels')
export class WhatsappChannelsController {
  constructor(private readonly channelService: WhatsappChannelService) {}

  @Get()
  listChannels() {
    return this.channelService.listChannels();
  }

  @Post()
  createChannel(@Body() params: CreateWhatsAppChannelDto) {
    return this.channelService.createChannel(params);
  }

  @Patch(':channelId')
  updateChannel(
    @Param('channelId', new ParseUUIDPipe()) channelId: string,
    @Body() params: UpdateWhatsAppChannelDto,
  ) {
    return this.channelService.updateChannel(channelId, params);
  }
}

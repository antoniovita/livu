import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWhatsAppChannelDto {
  @IsUUID()
  condominiumId: string;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  channelKey: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsNotEmpty()
  webhookSecret: string;

  @IsOptional()
  settingsJson?: Record<string, unknown>;
}

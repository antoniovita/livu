import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWhatsAppChannelDto {
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
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}

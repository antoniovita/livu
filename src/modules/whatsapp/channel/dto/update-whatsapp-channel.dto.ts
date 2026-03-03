import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWhatsAppChannelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  provider?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  displayName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  webhookSecret?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}

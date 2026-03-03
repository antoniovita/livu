import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ConversationQueryDto {
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @IsOptional()
  @IsUUID()
  condominiumId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  activeOnly?: 'true' | 'false';
}

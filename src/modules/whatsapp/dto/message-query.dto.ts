import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class MessageQueryDto {
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  conversationContextId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['INBOUND', 'OUTBOUND'])
  direction?: 'INBOUND' | 'OUTBOUND';

  @IsOptional()
  @IsString()
  status?: string;
}

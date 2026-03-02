import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AddUserMembershipDto {
  @IsUUID()
  condominiumId: string;

  @IsUUID()
  unitId: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

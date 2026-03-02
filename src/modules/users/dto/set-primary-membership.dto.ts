import { IsUUID } from 'class-validator';

export class SetPrimaryMembershipDto {
  @IsUUID()
  condominiumId: string;

  @IsUUID()
  unitId: string;
}

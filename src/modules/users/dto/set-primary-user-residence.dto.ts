import { IsUUID } from 'class-validator';

export class SetPrimaryUserResidenceDto {
  @IsUUID()
  condominiumId: string;

  @IsUUID()
  unitId: string;
}

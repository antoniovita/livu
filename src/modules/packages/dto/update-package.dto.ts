import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdatePackageDto {
  @IsOptional()
  @IsUUID()
  condominiumId?: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsUUID()
  receivedById?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['RECEIVED', 'NOTIFIED', 'PICKED_UP'])
  status?: 'RECEIVED' | 'NOTIFIED' | 'PICKED_UP';

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsDateString()
  pickedUpAt?: string;
}

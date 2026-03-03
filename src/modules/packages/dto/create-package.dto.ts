import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePackageDto {
  @IsUUID()
  condominiumId: string;

  @IsUUID()
  unitId: string;

  @IsUUID()
  receivedById: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsDateString()
  pickedUpAt?: string;
}

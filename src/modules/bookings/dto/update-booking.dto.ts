import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class UpdateBookingDto {
  @IsOptional()
  @IsUUID()
  condominiumId?: string;

  @IsOptional()
  @IsUUID()
  spaceId?: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsUUID()
  bookedById?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}

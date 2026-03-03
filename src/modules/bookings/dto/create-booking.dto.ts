import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  condominiumId: string;

  @IsUUID()
  spaceId: string;

  @IsUUID()
  unitId: string;

  @IsUUID()
  bookedById: string;

  @IsDateString()
  @IsNotEmpty()
  startAt: string;

  @IsDateString()
  @IsNotEmpty()
  endAt: string;
}

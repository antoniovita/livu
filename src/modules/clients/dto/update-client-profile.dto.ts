import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateClientProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}

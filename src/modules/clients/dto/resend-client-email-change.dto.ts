import { IsEmail, IsOptional } from 'class-validator';

export class ResendClientEmailChangeDto {
  @IsOptional()
  @IsEmail()
  newEmail?: string;
}

import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ChangeClientPasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword, Matches } from 'class-validator';

export class RegisterClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'phone must be a valid international phone number',
  })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}

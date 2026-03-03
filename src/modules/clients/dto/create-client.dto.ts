import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  status?: string;
}

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestClientEmailChangeDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ConfirmClientPhoneChangeDto {
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string;
}

import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestClientPhoneChangeDto {
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'newPhone must be a valid international phone number',
  })
  newPhone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

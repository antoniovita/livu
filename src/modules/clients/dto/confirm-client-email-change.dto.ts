import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ConfirmClientEmailChangeDto {
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string;
}

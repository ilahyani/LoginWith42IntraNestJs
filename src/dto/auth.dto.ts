import { IsNotEmpty, IsString } from 'class-validator';

export class authDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateChatDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  initialMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;
}

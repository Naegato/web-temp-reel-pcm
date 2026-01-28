import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
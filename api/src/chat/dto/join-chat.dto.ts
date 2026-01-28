import { IsUUID, IsNotEmpty } from 'class-validator';

export class JoinChatDto {
  @IsUUID()
  @IsNotEmpty()
  chatId: string;
}
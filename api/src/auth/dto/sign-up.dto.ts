import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class SignUpDto {
  @ApiProperty({
    example: 'test@test.test',
    description: 'The email of the user',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'strongPassword123!',
    description: 'The password of the user',
  })
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the user',
  })
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user',
  })
  @IsNotEmpty()
  lastname: string;
}

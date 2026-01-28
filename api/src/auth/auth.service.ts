import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadDto } from 'src/auth/dto/jwt-payload.dto';
import { PasswordService } from 'src/auth/password.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (
      !user ||
      !(await this.passwordService.comparePasswords(password, user.password))
    ) {
      throw new UnauthorizedException();
    }

    const payload: JwtPayloadDto = { sub: user.id, username: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(
    email: string,
    password: string,
    firstname: string,
    lastname: string,
  ) {
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await this.passwordService.hashPassword(password);
    const newUser = await this.usersService.create(
      email,
      hashedPassword,
      firstname,
      lastname,
    );

    const payload: JwtPayloadDto = { sub: newUser.id, username: newUser.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}

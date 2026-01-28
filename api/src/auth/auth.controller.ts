import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { SignInDto } from './dto/sign-in.dto';
import { ApiOperation } from '@nestjs/swagger';
import type { AuthRequestWithUser } from './types/auth-request.type';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate a user and return an access token.',
  })
  async login(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiOperation({
    summary: 'User registration',
    description: 'Register a new user and return an access token.',
  })
  async register(
    @Body()
    signUpDto: SignUpDto,
  ) {
    return this.authService.signUp(
      signUpDto.email,
      signUpDto.password,
      signUpDto.firstname,
      signUpDto.lastname,
    );
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get the authenticated user profile without sensitive data.',
  })
  async profile(@Request() req: AuthRequestWithUser) {
    // Maintenant req.user contient déjà toutes les données utilisateur
    return req.user;
  }
}

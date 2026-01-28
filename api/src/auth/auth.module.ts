import { Logger, Module } from '@nestjs/common';
import JwtConfig from 'src/auth/jwt.config';
import { PasswordService } from 'src/auth/password.service';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigType } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(JwtConfig)],
      useFactory: (jwtConfig: ConfigType<typeof JwtConfig>) => {
        Logger.log(`[AuthModule] Initializing JWT Module`);

        return {
          global: true,
          secret: jwtConfig.secret,
          signOptions: { expiresIn: '60s' },
        };
      },
      inject: [JwtConfig.KEY],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
// import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../guards/auth.jwt.guard';
import { FTStrategy } from './42.strategy';
import { FTAuthGuard } from '../guards/auth.42.guard';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'dontTellAnyone',
      // secret: new ConfigService().get('JWT_SECRET'),
      signOptions: { expiresIn: '30d' },
    }),
    PassportModule.register({ session: false }),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    FTAuthGuard,
    FTStrategy,
  ],
})
export class AuthModule {}

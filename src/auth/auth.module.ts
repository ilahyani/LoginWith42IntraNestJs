import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/guards/auth.jwt.guard';
import { FTStrategy } from './42.strategy';
import { FTAuthGuard } from 'src/guards/auth.42.guard';
// import { SessionSerializer } from './auth.serializer';
// import { IsAuthenticatedGuard } from 'src/guards/isAuthenticated.guard';
// import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: new ConfigService().get('JWT_SECRET'),
      signOptions: { expiresIn: '30d' },
    }),
    // PassportModule.register({ session: false }),
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
    // SessionSerializer,
    // IsAuthenticatedGuard,
  ],
})
export class AuthModule {}

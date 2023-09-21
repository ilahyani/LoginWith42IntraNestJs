import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private reflector: Reflector,
    private authservice: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) return true;
    const req = context.switchToHttp().getRequest();
    const token = req.cookies['JWT_TOKEN'];
    if (!token) throw new UnauthorizedException('Invalid Token');
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      const { username, email, avatarLink, isAuthenticated } =
        await this.authservice.findUser(payload.email);
      req['user'] = {
        username,
        email,
        avatarLink,
        isAuthenticated,
      };
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

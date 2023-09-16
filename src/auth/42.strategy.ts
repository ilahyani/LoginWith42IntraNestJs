import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-42';
import { AuthService } from './auth.service';

@Injectable()
export class FTStrategy extends PassportStrategy(Strategy, '42') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get('42_UID'),
      clientSecret: config.get('42_SECRET'),
      callbackURL: 'http://localhost:3000/auth/42-redirect',
      Scope: ['profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    // console.log(profile);
    let user = await this.authService.findUser(profile.username);
    if (!user) {
      console.log('user not found. Signing up...');
      await this.authService.signup({
        email: profile.emails[0].value,
        username: profile.username,
        password: 'temporaryPassword',
      });
      user = await this.authService.findUser(profile.username);
      console.log('user signed up', user);
    }
    return user || null;
  }
}

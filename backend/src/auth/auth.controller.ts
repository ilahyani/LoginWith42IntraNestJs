import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { signinDTO, signupDTO } from 'src/dto';
import { FTAuthGuard } from 'src/guards/auth.42.guard';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  @UseGuards(FTAuthGuard)
  @SetMetadata('isPublic', true)
  @Get('42')
  auth42() {}

  @UseGuards(FTAuthGuard)
  @SetMetadata('isPublic', true)
  @Get('42-redirect')
  auth42Redirect(@Req() req) {
    // form pre-filled with avatar and username and [hidden] email
    // user fills password and fires a request to finish_signup
    return { user: req.user.username };
  }

  @SetMetadata('isPublic', true)
  @Post('finish_signup')
  async finish_signup(
    @Body() dto: signupDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.finish_signup(dto);
    res.cookie('JWT_TOKEN', token.accessToken);
    return "You're in, " + dto.username;
  }

  @HttpCode(200)
  @SetMetadata('isPublic', true)
  @Post('signin')
  async signin(
    @Body() dto: signinDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.signin(dto);
    res.cookie('JWT_TOKEN', token.accessToken);
    return "You're in, " + dto.username;
  }

  @Get('Profile')
  getProfile(@Req() req) {
    if (!req.user.isAuthenticated)
      throw new ForbiddenException('Unauthenticated User');
    return req.user;
  }

  @Get('signout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('JWT_TOKEN', '', { expires: new Date() });
    return { msg: 'Session Terminated' };
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { authDTO, signinDTO } from 'src/dto';
import { FTAuthGuard } from 'src/guards/auth.42.guard';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SetMetadata('isPublic', true)
  @Post('signup')
  async signup(
    @Body() dto: authDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log(dto);
    const token = await this.authService.signup(dto);
    res.cookie('JWT_TOKEN', token.accessToken);
    return token;
  }

  @SetMetadata('isPublic', true)
  @HttpCode(200)
  @Post('signin')
  async signin(
    @Body() dto: signinDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.signin(dto);
    res.cookie('JWT_TOKEN', token.accessToken);
    return token;
  }

  @UseGuards(FTAuthGuard)
  @SetMetadata('isPublic', true)
  @Get('42')
  auth42() {}

  @UseGuards(FTAuthGuard)
  @SetMetadata('isPublic', true)
  @Get('42-redirect')
  auth42Redirect() {
    return 'add password to continue';
  }

  @Get('Profile')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Get('signout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('JWT_TOKEN', '', { expires: new Date() });
    return 'session ended';
  }
}

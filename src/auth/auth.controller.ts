import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  SetMetadata,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { authDTO } from 'src/dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SetMetadata('isPublic', true)
  @Post('signup')
  signup(@Body() dto: authDTO) {
    return this.authService.signup(dto);
  }

  @SetMetadata('isPublic', true)
  @HttpCode(200)
  @Post('signin')
  signin(@Body() dto: authDTO) {
    return this.authService.signin(dto);
  }

  @Get('Profile')
  getProfile(@Request() req) {
    return req.user;
  }
}

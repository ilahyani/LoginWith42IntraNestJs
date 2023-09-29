import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  SetMetadata,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { signinDTO, signupDTO } from 'src/dto';
import { FTAuthGuard } from 'src/guards/auth.42.guard';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private config: ConfigService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  @UseGuards(FTAuthGuard)
  @SetMetadata('isPublic', true)
  @Get('42')
  auth42() {}

  @UseGuards(FTAuthGuard)
  @SetMetadata('isPublic', true)
  @Get('42-redirect')
  async auth42Redirect(@Req() req, @Res({ passthrough: true }) res) {
    if (req.user.isAuthenticated) {
      const { accessToken } = await this.authService.signToken(
        req.user.id,
        req.user.username,
      );
      res.cookie('JWT_TOKEN', accessToken);
      res.redirect('http://localhost:3001/profile');
      // return { accessToken: accessToken };
    } else {
      const userToken = await this.jwtService.signAsync({
        sub: -42,
        email: req.user.email,
      });
      res.cookie('USER', userToken);
      res.redirect('http://localhost:3001/auth/42-redirect');
      // return { msg: 'Success' };
    }
  }

  @SetMetadata('isPublic', true)
  @Get('preAuthData')
  async getPreAuthData(@Req() req) {
    const token = req.cookies['USER'];
    if (!token) throw new UnauthorizedException('Invalid Request');
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      const { email, username, avatarLink, isAuthenticated } =
        await this.authService.findUser(payload.email);
      const user = {
        email,
        username,
        avatarLink,
        isAuthenticated, // DO I REALLY NEED THIS ??????
      };
      return { user };
    } catch {
      throw new UnauthorizedException();
    }
  }

  @SetMetadata('isPublic', true)
  @Post('finish_signup')
  async finish_signup(
    @Body() dto: signupDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const UserToken = req.cookies['USER'];
    const token = await this.authService.finish_signup(dto, UserToken);
    res.cookie('JWT_TOKEN', token.accessToken);
    res.cookie('USER', '', { expires: new Date() });
    return { msg: 'Success' };
  }

  @SetMetadata('isPublic', true)
  @Post('uploadAvatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}_${file.originalname}`);
        },
      }),
    }),
  )
  async uploadAvatar(@Req() req, @UploadedFile() file) {
    const UserToken = req.cookies['USER'];
    this.authService.saveAvatar(UserToken, file);
    return { msg: 'success' };
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
    return { token: token };
  }

  @Get('signout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('JWT_TOKEN', '', { expires: new Date() });
    return { msg: 'Success' };
  }
}

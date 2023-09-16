import { ForbiddenException, Injectable } from '@nestjs/common';
import { authDTO, signinDTO, signupDTO } from 'src/dto';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: authDTO) {
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          hash: hash,
          avatarLink: dto.avatar,
          isAuthenticated: false,
        },
      });
      console.log(user);
      // return 'add password';
      // return this.signToken(user.id, user.username, false);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'An account with email or username already exists',
          );
        }
      }
    }
  }

  async signin(dto: signinDTO): Promise<{ accessToken: string }> {
    const user = await this.findUser(dto.username);
    if (!user) throw new ForbiddenException('username or password incorrect');
    if (!user.isAuthenticated)
      throw new ForbiddenException('Unauthenticated User');
    const pwMatch = await argon.verify(user.hash, dto.password);
    if (!pwMatch)
      throw new ForbiddenException('username or password incorrect');
    console.log(user);
    return this.signToken(user.id, user.username);
  }

  async add_password(dto: signupDTO) {
    let user = await this.findUser(dto.username);
    if (!user)
      throw new ForbiddenException('you need to signup with intra first');
    if (user.isAuthenticated)
      throw new ForbiddenException('User Already Authenticated ');
    if (dto.password !== dto.passwordConf)
      throw new ForbiddenException("passwords don't match");
    // const hash = dto.password;
    const hash = await argon.hash(dto.password);
    console.log('user', user);
    await this.prisma.user.updateMany({
      where: {
        username: dto.username,
      },
      data: {
        hash: hash,
        isAuthenticated: true,
      },
    });
    user = await this.findUser(dto.username);
    console.log('updated user', user);
    return this.signToken(user.id, user.username);
  }

  async signToken(
    userID: number,
    username: string,
  ): Promise<{ accessToken: string }> {
    const payload = { sub: userID, username };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async findUser(username: string) {
    //findUnique
    const user = await this.prisma.user.findFirst({
      where: {
        username: username,
      },
    });
    return user;
  }
}

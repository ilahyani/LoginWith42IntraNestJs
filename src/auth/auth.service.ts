import { ForbiddenException, Injectable } from '@nestjs/common';
import { authDTO } from 'src/dto';
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
          username: dto.username,
          hash: hash,
        },
      });
      return this.signToken(user.id, user.username);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('This username taken');
        }
      }
    }
  }

  async signin(dto: authDTO): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });
    if (!user) throw new ForbiddenException('username or password incorrect');
    const pwMatch = await argon.verify(user.hash, dto.password);
    if (!pwMatch)
      throw new ForbiddenException('username or password incorrect');
    return this.signToken(user.id, user.username);
  }

  async signToken(
    userID: number,
    username: string,
  ): Promise<{ accessToken: string }> {
    const payload = { sub: userID, username: username };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}

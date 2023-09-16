import { ForbiddenException, Injectable } from '@nestjs/common';
import { authDTO, signinDTO } from 'src/dto';
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
    console.log(dto);
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          hash: hash,
        },
      });
      return this.signToken(user.id, user.username, user.email);
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
    const pwMatch = await argon.verify(user.hash, dto.password);
    if (!pwMatch)
      throw new ForbiddenException('username or password incorrect');
    return this.signToken(user.id, user.username, user.email);
  }

  async signToken(
    userID: number,
    username: string,
    email: string,
  ): Promise<{ accessToken: string }> {
    const payload = { sub: userID, username: username, email: email };
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

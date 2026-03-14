import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decode } from '@auth/core/jwt';
import { TokenPayloadSchema, z } from '@repo/zod';

@Injectable()
export class TokenService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.getOrThrow<string>('NEXTAUTH_SECRET');
  }

  async verifyToken(
    token: string,
    salt: string,
  ): Promise<z.infer<typeof TokenPayloadSchema>> {
    const payload = await decode({
      token,
      secret: this.secret,
      salt,
    });

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired session token');
    }

    try {
      return TokenPayloadSchema.parse(payload);
    } catch {
      throw new UnauthorizedException('Invalid or expired session token');
    }
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decode } from '@auth/core/jwt';
import { SessionPayloadSchema, z } from '@repo/zod';

type SessionPayload = z.infer<typeof SessionPayloadSchema>;

@Injectable()
export class SessionService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.getOrThrow<string>('NEXTAUTH_SECRET');
  }

  async verifySession(token: string, salt: string): Promise<SessionPayload> {
    const payload = await decode({
      token,
      secret: this.secret,
      salt,
    });

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired session token');
    }

    try {
      return SessionPayloadSchema.parse(payload);
    } catch {
      throw new UnauthorizedException('Invalid or expired session token');
    }
  }
}

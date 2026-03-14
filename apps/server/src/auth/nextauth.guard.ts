import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenPayloadSchema, z } from '@repo/zod';
import { TokenService } from './token.service';
import { cookieNames } from 'src/constants/auth';

export type RequestWithAuth = Omit<Request, 'user' | 'cookies'> & {
  cookies: Record<string, string | undefined>;
  user?: z.infer<typeof TokenPayloadSchema>;
};

@Injectable()
export class NextAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();

    const tokenInfo = this.extractToken(request);

    if (!tokenInfo) {
      console.warn('[NextAuthGuard] No auth token found in cookies');
      throw new UnauthorizedException('No auth token found');
    }

    const user = await this.tokenService.verifyToken(
      tokenInfo.token,
      tokenInfo.salt,
    );

    // Attach decoded token payload to request for downstream use
    request.user = user;

    return true;
  }

  private extractToken(
    request: RequestWithAuth,
  ): { token: string; salt: string } | undefined {
    for (const name of cookieNames) {
      const token = request.cookies[name];
      if (typeof token === 'string' && token.length > 0) {
        return { token, salt: name };
      }
    }

    return undefined;
  }
}

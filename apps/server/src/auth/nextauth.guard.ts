import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionPayloadSchema, z } from '@repo/zod';
import { SessionService } from './session.service';

export type RequestWithAuth = Omit<Request, 'user' | 'cookies'> & {
  cookies: Record<string, string | undefined>;
  user?: z.infer<typeof SessionPayloadSchema>;
};

@Injectable()
export class NextAuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();

    const sessionInfo = this.extractSessionToken(request);

    if (!sessionInfo) {
      console.warn('[NextAuthGuard] No session token found in cookies');
      throw new UnauthorizedException('No session token found');
    }

    const session = await this.sessionService.verifySession(
      sessionInfo.token,
      sessionInfo.salt,
    );

    // Attach decoded session payload to request for downstream use
    request.user = session;

    return true;
  }

  private extractSessionToken(
    request: RequestWithAuth,
  ): { token: string; salt: string } | undefined {
    const cookieNames = [
      'authjs.session-token',
      '__Secure-authjs.session-token',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
    ];

    for (const name of cookieNames) {
      const token = request.cookies[name];
      if (typeof token === 'string' && token.length > 0) {
        return { token, salt: name };
      }
    }

    return undefined;
  }
}

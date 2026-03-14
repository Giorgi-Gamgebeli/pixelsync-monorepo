import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { RequestWithAuth } from './nextauth.guard';
import { SessionPayloadSchema, z } from '@repo/zod';

export const SessionUser = createParamDecorator(
  (
    _data: unknown,
    ctx: ExecutionContext,
  ): z.infer<typeof SessionPayloadSchema> | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuth>();

    return request.user;
  },
);

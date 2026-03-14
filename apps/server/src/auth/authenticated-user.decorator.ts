import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { RequestWithAuth } from './nextauth.guard';

export const AuthenticatedUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;

    return user;
  },
);

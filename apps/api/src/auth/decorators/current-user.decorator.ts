import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CognitoUser } from '@music-box/shared';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CognitoUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

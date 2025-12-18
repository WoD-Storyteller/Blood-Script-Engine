import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentEngine = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.engine;
  },
);

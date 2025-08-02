import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { Session, User } from 'better-auth';
import type { PinoLogger } from 'hono-pino';

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
    user: User | null;
    session: Session | null;
  };
}

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;

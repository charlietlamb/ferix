import { env } from '@ferix/env';
import type { MiddlewareHandler } from 'hono';
import { pinoLogger as logger } from 'hono-pino';
import pino from 'pino';
import pretty from 'pino-pretty';

export function pinoLogger(): MiddlewareHandler {
  return (c, next) => {
    const loggerMiddleware = logger({
      pino: pino(
        {
          level: env.LOG_LEVEL || 'info',
          serializers: {
            req: (req) => ({
              url: req.url,
              method: req.method,
            }),
          },
        },
        env.NODE_ENV === 'production' ? undefined : pretty()
      ),
      http: {
        reqId: () => {
          return crypto.randomUUID();
        },
      },
    });
    return loggerMiddleware(c, next);
  };
}

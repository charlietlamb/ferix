import type { Session, User } from 'better-auth';
import type { PinoLogger } from 'hono-pino';

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
    user: User | null;
    session: Session | null;
  };
}

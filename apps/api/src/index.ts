import { OpenAPIHono } from '@hono/zod-openapi';
import { notFound, onError, serveEmojiFavicon } from 'stoker/middlewares';
import defaultHook from 'stoker/openapi/default-hook';
import configure from './config';
import { auth } from './lib/auth';
import { pinoLogger } from './middleware/pino-logger';
import { aiRouter } from './routers/ai/ai.router';

const app = new OpenAPIHono({ strict: false, defaultHook }).basePath('/api');

app.use(pinoLogger());
app.use(serveEmojiFavicon('🔥'));
app.notFound(notFound);
app.onError(onError);

configure(app);

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.on(['POST', 'GET'], '/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

const routers = [aiRouter] as const;

for (const router of routers) {
  app.route('/', router);
}

export default app;

export type App = typeof app;
export type AppType = (typeof routers)[number];

import {
  type HonoWithConvex,
  HttpRouterWithHono,
} from 'convex-helpers/server/hono';
import { Hono } from 'hono';
import { createAuth } from '../lib/auth';
import type { ActionCtx } from './_generated/server';

const app: HonoWithConvex<ActionCtx> = new Hono();

// Redirect root well-known to api well-known
app.get('/.well-known/openid-configuration', (c) => {
  return c.redirect('/api/auth/convex/.well-known/openid-configuration');
});

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

const http = new HttpRouterWithHono(app);

export default http;

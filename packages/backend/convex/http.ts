import {
  type HonoWithConvex,
  HttpRouterWithHono,
} from 'convex-helpers/server/hono';
import { Hono } from 'hono';
import { createAuth } from '../lib/auth';
import { type ActionCtx, httpAction } from './_generated/server';
import { streamChat } from './chat';

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
http.route({
  path: '/chat-stream',
  method: 'POST',
  handler: streamChat,
});

http.route({
  path: '/chat-stream',
  method: 'OPTIONS',
  // biome-ignore lint: CORS preflight handler doesn't need await
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    if (
      headers.get('Origin') !== null &&
      headers.get('Access-Control-Request-Method') !== null &&
      headers.get('Access-Control-Request-Headers') !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Digest, Authorization',
          'Access-Control-Max-Age': '86400',
        }),
      });
    }
    return new Response();
  }),
});

export default http;

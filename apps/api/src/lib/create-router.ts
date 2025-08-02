import { OpenAPIHono } from '@hono/zod-openapi';

export function createRouter() {
  return new OpenAPIHono({ strict: false });
}

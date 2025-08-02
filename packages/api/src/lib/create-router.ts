import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings } from '../utils/bindings';

export function createRouter() {
  return new OpenAPIHono<AppBindings>({ strict: false });
}

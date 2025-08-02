import type { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import type { AppBindings } from '../utils/bindings';

export type AppOpenAPI = OpenAPIHono<AppBindings>;

export function configureOpenAPI(app: AppOpenAPI) {
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      title: 'Ferix AI API',
      version: '0.0.1',
    },
  });

  app.get(
    '/reference',
    Scalar({
      url: '/api/doc',
      theme: 'bluePlanet',
      layout: 'classic',
      defaultHttpClient: {
        targetKey: 'node',
        clientKey: 'fetch',
      },
    })
  );
}

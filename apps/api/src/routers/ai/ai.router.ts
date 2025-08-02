import { createRouter } from '../../lib/create-router';
import { getResponseHandler } from './handlers/get-response.handler';
import { getResponseRoute } from './routes/get-response.route';

export const aiRouter = createRouter().openapi(
  getResponseRoute,
  getResponseHandler
);

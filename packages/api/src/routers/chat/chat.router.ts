import { createRouter } from '../../lib/create-router';
import { chatHandler } from './handlers/chat.handler';
import { chatRoute } from './routes/chat.route';

export const chatRouter = createRouter().openapi(chatRoute, chatHandler);

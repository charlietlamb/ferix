import app from '@ferix/api/index';
import { handle } from 'hono/vercel';

export const runtime = 'nodejs';

export const GET = handle(app);
export const POST = handle(app);

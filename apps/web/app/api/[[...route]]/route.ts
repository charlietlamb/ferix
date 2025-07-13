import { handle } from 'hono/vercel'
import app from '@ferix/api/index'

export const runtime = 'nodejs'

export const GET = handle(app)
export const POST = handle(app)

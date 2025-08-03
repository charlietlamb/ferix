import betterAuth from '@convex-dev/better-auth/convex.config';
import persistentTextStreaming from '@convex-dev/persistent-text-streaming/convex.config';

import { defineApp } from 'convex/server';

const app: ReturnType<typeof defineApp> = defineApp();
app.use(betterAuth);
app.use(persistentTextStreaming);

export default app;

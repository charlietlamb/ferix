import { env } from '@ferix/env';

export default {
  providers: [
    {
      // Your Convex site URL is provided in a system
      // environment variable
      domain: env.NEXT_PUBLIC_CONVEX_SITE_URL,

      // Application ID has to be "convex"
      applicationID: 'convex',
    },
  ],
};

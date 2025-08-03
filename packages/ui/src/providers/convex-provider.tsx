'use client';

import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { env } from '@ferix/env';
import { authClient } from '@ferix/ui/lib/auth-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexReactClient } from 'convex/react';
import type { ReactNode } from 'react';

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: convexQueryClient.queryFn(),
      queryKeyHashFn: convexQueryClient.hashFn(),
    },
  },
});

export function ConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexBetterAuthProvider>
  );
}

'use client';

import { Link } from '@ferix/i18n/navigation';
import { Authenticated, Unauthenticated, useConvexAuth } from 'convex/react';
import { authClient } from '../lib/auth-client';

export function ConvexAuthenticatedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = authClient.useSession();
  console.log('betterAuth session', session);
  const { isAuthenticated } = useConvexAuth();
  console.log('has convex session', isAuthenticated);
  return children;
  return (
    <>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        <div className="flex h-full w-full items-center justify-center gap-1">
          You are not logged in, please
          <Link className="underline" href="/auth/sign-in">
            sign in
          </Link>
          to continue.
        </div>
      </Unauthenticated>
    </>
  );
}

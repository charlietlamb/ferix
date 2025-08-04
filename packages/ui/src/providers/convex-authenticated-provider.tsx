'use client';

import { Link } from '@ferix/i18n/navigation';
import { Authenticated, Unauthenticated } from 'convex/react';

export function ConvexAuthenticatedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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

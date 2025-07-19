'use client';

import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { useRouter } from '@ferix/i18n/navigation';
import { authClient } from '@ferix/ui/lib/auth-client';
import Link from 'next/link';

export function BetterAuthUIProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={authClient}
      credentials={{
        rememberMe: true,
        forgotPassword: true,
        passwordValidation: {
          minLength: 8,
          maxLength: 100,
        },
      }}
      Link={Link}
      navigate={router.push}
      onSessionChange={() => router.refresh()}
      organization={true}
      replace={router.replace}
      social={{
        providers: ['google', 'github'],
      }}
    >
      {children}
    </AuthUIProvider>
  );
}

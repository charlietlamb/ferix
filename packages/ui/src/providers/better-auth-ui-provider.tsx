'use client'

import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { authClient } from '@ferix/ui/lib/auth-client'
import { useRouter } from '@ferix/i18n/navigation'
import Link from 'next/link'

export function BetterAuthUIProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={Link}
      credentials={{
        rememberMe: true,
        forgotPassword: true,
        passwordValidation: {
          minLength: 8,
          maxLength: 100,
        },
      }}
      social={{
        providers: ['google', 'github'],
      }}
      organization={true}
    >
      {children}
    </AuthUIProvider>
  )
}

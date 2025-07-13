import { BetterAuthCard } from '@ferix/ui/components/auth/better-auth-card'

export default function AuthPage({ params }: { params: { pathname: string } }) {
  return (
    <div className="flex size-full grow flex-col items-center justify-center h-screen p-8">
      <BetterAuthCard pathname={params.pathname} view="SIGN_UP" />
    </div>
  )
}

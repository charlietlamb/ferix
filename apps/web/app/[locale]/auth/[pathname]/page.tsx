import { BetterAuthCard } from '@ferix/ui/components/auth/better-auth-card';

export default async function AuthPage({
  params,
}: {
  params: Promise<{ pathname: string }>;
}) {
  const { pathname } = await params;

  return (
    <main className="container flex h-screen grow flex-col items-center justify-center gap-4 self-center p-4 md:p-6">
      <BetterAuthCard pathname={pathname} />
    </main>
  );
}

"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthenticated();
  const router = useRouter();

  if (isAuthenticated) {
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {children}
    </div>
  );
}

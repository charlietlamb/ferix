"use client";

import { useSession } from "@ferix/auth/client";

export function useAuthenticated() {
  const { data: session, isPending } = useSession();

  return {
    user: session?.user,
    isAuthenticated: !!session?.user,
    isAdmin: session?.user?.role === "admin",
    isPending,
  };
}

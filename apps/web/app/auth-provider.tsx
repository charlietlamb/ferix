"use client";

import { authClient, useSession } from "@ferix/auth/client";
import { accountsAtom, userAtom } from "@ferix/ui/store/auth";
import { useSetAtom } from "jotai";
import posthog from "posthog-js";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const setUser = useSetAtom(userAtom);
  const setAccounts = useSetAtom(accountsAtom);

  useEffect(() => {
    setUser(session?.user);

    if (session?.user) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        username: session.user.username,
      });

      authClient.listAccounts().then(({ data }) => {
        setAccounts(data ?? undefined);
      });
    } else {
      posthog.reset();
      setAccounts(undefined);
    }
  }, [session?.user, setUser, setAccounts]);

  return children;
}

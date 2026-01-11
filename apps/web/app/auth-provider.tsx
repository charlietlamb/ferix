"use client";

import { authClient, useSession } from "@ferix/auth/client";
import { accountsAtom, userAtom } from "@ferix/ui/store/auth";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const setUser = useSetAtom(userAtom);
  const setAccounts = useSetAtom(accountsAtom);

  useEffect(() => {
    setUser(session?.user);

    if (session?.user) {
      authClient.listAccounts().then(({ data }) => {
        setAccounts(data ?? undefined);
      });
    } else {
      setAccounts(undefined);
    }
  }, [session?.user, setUser, setAccounts]);

  return children;
}

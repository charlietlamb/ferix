"use client";

import { admin, useSession } from "@ferix/auth/client";
import { useCallback } from "react";
import { toast } from "sonner";

export function useImpersonation() {
  const { data: session, refetch } = useSession();

  const isImpersonating = !!session?.session?.impersonatedBy;

  const impersonateUser = useCallback(
    async (userId: string) => {
      try {
        await admin.impersonateUser({ userId });
        await refetch();
        toast.success("Now impersonating user");
      } catch {
        toast.error("Failed to impersonate user");
      }
    },
    [refetch]
  );

  const stopImpersonating = useCallback(async () => {
    try {
      await admin.stopImpersonating();
      await refetch();
      toast.success("Stopped impersonating");
    } catch {
      toast.error("Failed to stop impersonating");
    }
  }, [refetch]);

  return { isImpersonating, impersonateUser, stopImpersonating };
}

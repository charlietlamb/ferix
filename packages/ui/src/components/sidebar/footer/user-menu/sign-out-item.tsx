"use client";

import { signOut } from "@ferix/auth/client";
import { DropdownMenuItem } from "@ferix/ui/components/ui/dropdown-menu";
import { SignOutIcon } from "@phosphor-icons/react";
import { Result } from "better-result";
import { toast } from "sonner";

export function SignOutItem() {
  return (
    <DropdownMenuItem
      onClick={async () => {
        const result = await Result.tryPromise(() => signOut());
        result.match({
          ok: () => toast.success("Signed out successfully"),
          err: (e) => toast.error(e.message ?? "Failed to sign out"),
        });
      }}
    >
      <SignOutIcon className="size-4" />
      Sign Out
    </DropdownMenuItem>
  );
}

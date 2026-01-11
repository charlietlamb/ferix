"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { SignInIcon } from "@phosphor-icons/react";

export function FooterUnauthenticated() {
  const { open } = useDialog();

  return (
    <Button className="w-full" onClick={() => open("signInDialog")}>
      <SignInIcon className="size-4" />
      Sign in
    </Button>
  );
}

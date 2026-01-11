"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { Button } from "@ferix/ui/components/ui/button";
import { SignInIcon } from "@phosphor-icons/react";

export function FooterUnauthenticated() {
  const router = useRouter();
  return (
    <Button className="w-full" onClick={() => router.push("/sign-in")}>
      <SignInIcon className="size-4" />
      Sign in
    </Button>
  );
}

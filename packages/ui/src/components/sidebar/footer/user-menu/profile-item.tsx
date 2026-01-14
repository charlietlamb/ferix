"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { DropdownMenuItem } from "@ferix/ui/components/ui/dropdown-menu";
import { UserIcon } from "@phosphor-icons/react";

interface ProfileItemProps {
  username: string;
}

export function ProfileItem({ username }: ProfileItemProps) {
  const router = useRouter();

  return (
    <DropdownMenuItem onClick={() => router.push(`/user/${username}`)}>
      <UserIcon className="size-4" />
      Profile
    </DropdownMenuItem>
  );
}

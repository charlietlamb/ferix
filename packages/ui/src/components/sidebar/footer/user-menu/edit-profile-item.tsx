"use client";

import { DropdownMenuItem } from "@ferix/ui/components/ui/dropdown-menu";
import { UserIcon } from "@phosphor-icons/react";

export function EditProfileItem() {
  return (
    <DropdownMenuItem>
      <UserIcon className="size-4" />
      Edit Profile
    </DropdownMenuItem>
  );
}

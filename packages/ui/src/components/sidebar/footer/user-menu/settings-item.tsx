"use client";

import { DropdownMenuItem } from "@ferix/ui/components/ui/dropdown-menu";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { GearIcon } from "@phosphor-icons/react";

export function SettingsItem() {
  const { open } = useDialog();

  return (
    <DropdownMenuItem onClick={() => open("settingsDialog")}>
      <GearIcon className="size-4" />
      Settings
    </DropdownMenuItem>
  );
}

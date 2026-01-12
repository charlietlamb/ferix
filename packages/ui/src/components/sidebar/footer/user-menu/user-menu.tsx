"use client";

import { ThemeToggle } from "@ferix/ui/components/theme/theme-toggle";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@ferix/ui/components/ui/dropdown-menu";
import type { User } from "better-auth";
import { SettingsItem } from "./settings-item";
import { SignOutItem } from "./sign-out-item";

export function UserMenu({ user }: { user: User }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <Avatar size="sm">
            <AvatarImage alt={user.name} src={user.image ?? undefined} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top">
          <SettingsItem />
          <SignOutItem />
        </DropdownMenuContent>
      </DropdownMenu>
      <ThemeToggle />
    </div>
  );
}

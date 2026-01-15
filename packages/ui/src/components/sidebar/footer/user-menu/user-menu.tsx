"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ferix/ui/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ferix/ui/components/ui/sidebar";
import { CaretUpIcon } from "@phosphor-icons/react";
import type { User } from "better-auth";
import { ProfileItem } from "./profile-item";
import { SettingsItem } from "./settings-item";
import { SignOutItem } from "./sign-out-item";
import { ThemeItem } from "./theme-item";

type UserWithUsername = User & {
  username?: string | null;
};

export function UserMenu({ user }: { user: UserWithUsername }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <SidebarMenuButton
            className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
            render={<DropdownMenuTrigger />}
            size="lg"
          >
            <Avatar size="sm">
              <AvatarImage alt={user.name} src={user.image ?? undefined} />
              <AvatarFallback>
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              {user.email && (
                <span className="truncate text-muted-foreground text-xs">
                  {user.email}
                </span>
              )}
            </div>
            <CaretUpIcon className="ml-auto size-4" />
          </SidebarMenuButton>
          <DropdownMenuContent align="start" side="top">
            {user.username && (
              <>
                <ProfileItem username={user.username} />
                <DropdownMenuSeparator />
              </>
            )}
            <SettingsItem />
            <ThemeItem />
            <DropdownMenuSeparator />
            <SignOutItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

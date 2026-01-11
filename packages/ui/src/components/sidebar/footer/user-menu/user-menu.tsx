"use client";

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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@ferix/ui/components/ui/sidebar";
import { cn } from "@ferix/ui/lib/utils";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import type { User } from "better-auth";
import { SettingsItem } from "./settings-item";
import { SignOutItem } from "./sign-out-item";

export function UserMenu({ user }: { user: User }) {
  const { open } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <SidebarMenuButton
                {...props}
                className={cn(
                  "data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground",
                  !open && "justify-center"
                )}
                size="lg"
              >
                <Avatar size="sm">
                  <AvatarImage alt={user.name} src={user.image ?? undefined} />
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {open && (
                  <>
                    <span className="truncate font-medium">{user.name}</span>
                    <CaretUpDownIcon className="ml-auto size-4" />
                  </>
                )}
              </SidebarMenuButton>
            )}
          />
          <DropdownMenuContent side="top">
            <SettingsItem />
            <SignOutItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

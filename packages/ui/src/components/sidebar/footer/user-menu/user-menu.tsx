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
} from "@ferix/ui/components/ui/sidebar";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import type { User } from "better-auth";
import { EditProfileItem } from "./edit-profile-item";
import { SignOutItem } from "./sign-out-item";

export function UserMenu({ user }: { user: User }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <SidebarMenuButton
                {...props}
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                size="lg"
              >
                <Avatar size="sm">
                  <AvatarImage alt={user.name} src={user.image ?? undefined} />
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-medium">{user.name}</span>
                <CaretUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            )}
          />
          <DropdownMenuContent side="top">
            <EditProfileItem />
            <SignOutItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

"use client";

import { signOut } from "@ferix/auth/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ferix/ui/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ferix/ui/components/ui/sidebar";
import { CaretUpDownIcon, SignOutIcon, UserIcon } from "@phosphor-icons/react";
import type { User } from "better-auth";
import { Result } from "better-result";
import { toast } from "sonner";

export function SidebarFooterUserMenu({ user }: { user: User }) {
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
            <DropdownMenuItem>
              <UserIcon className="size-4" />
              Edit Profile
            </DropdownMenuItem>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ferix/ui/components/ui/sidebar";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { MoonIcon, SignInIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

export function FooterUnauthenticated() {
  const { open: openDialog } = useDialog();
  const { resolvedTheme, setTheme } = useTheme();

  function handleToggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleToggleTheme}>
          {resolvedTheme === "dark" ? (
            <SunIcon className="size-4" />
          ) : (
            <MoonIcon className="size-4" />
          )}
          <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => openDialog("signInDialog")}>
          <SignInIcon className="size-4" />
          <span>Log in</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

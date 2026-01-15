"use client";

import { DropdownMenuItem } from "@ferix/ui/components/ui/dropdown-menu";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

export function ThemeItem() {
  const { resolvedTheme, setTheme } = useTheme();

  function handleToggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <DropdownMenuItem onClick={handleToggleTheme}>
      {resolvedTheme === "dark" ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
      <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
    </DropdownMenuItem>
  );
}

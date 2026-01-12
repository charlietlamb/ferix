"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

function getThemeIcon(theme: string | undefined) {
  if (theme === "light") {
    return SunIcon;
  }
  if (theme === "dark") {
    return MoonIcon;
  }
  return DesktopIcon;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const Icon = getThemeIcon(theme);

  return (
    <Button
      className="rounded-full"
      onClick={cycleTheme}
      size="icon-sm"
      variant="outline"
    >
      <Icon className="size-4" />
    </Button>
  );
}

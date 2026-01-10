"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster richColors theme={resolvedTheme === "dark" ? "dark" : "light"} />
  );
}

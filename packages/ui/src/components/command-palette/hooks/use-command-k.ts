"use client";

import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useEffect } from "react";

export function useCommandK() {
  const { open } = useDialog();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open("commandPaletteDialog");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);
}

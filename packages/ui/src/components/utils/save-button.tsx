"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { Button } from "@ferix/ui/components/ui/button";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { cn } from "@ferix/ui/lib/utils";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { useMutation } from "convex/react";

interface SaveButtonProps {
  promptId: Id<"prompts">;
  isSaved: boolean;
  onOptimisticUpdate?: (saved: boolean) => void;
  variant?: "button" | "icon";
  label?: { save: string; unsave: string };
  className?: string;
}

export function SaveButton({
  promptId,
  isSaved,
  onOptimisticUpdate,
  variant = "icon",
  label,
  className,
}: SaveButtonProps) {
  const { isAuthenticated } = useAuthenticated();
  const { open: openDialog } = useDialog();
  const toggleSave = useMutation(api.prompts.toggleSave);

  const handleSave = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!isAuthenticated) {
      openDialog("signInDialog");
      return;
    }
    onOptimisticUpdate?.(!isSaved);
    toggleSave({ promptId });
  };

  if (variant === "icon") {
    return (
      <button
        className={cn(
          "relative cursor-pointer rounded p-1 transition-all duration-150 hover:scale-110 hover:bg-muted hover:text-foreground active:scale-95",
          isSaved && "text-primary hover:text-primary",
          className
        )}
        onClick={handleSave}
        type="button"
      >
        <BookmarkSimpleIcon
          className="size-4 transition-transform duration-200"
          weight={isSaved ? "fill" : "regular"}
        />
      </button>
    );
  }

  return (
    <Button
      className={cn("w-full justify-start", className)}
      onClick={handleSave}
      variant="outline"
    >
      <BookmarkSimpleIcon
        className="mr-2 size-4"
        weight={isSaved ? "fill" : "regular"}
      />
      {isSaved ? label?.unsave : label?.save}
    </Button>
  );
}

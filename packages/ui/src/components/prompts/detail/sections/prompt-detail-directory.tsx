"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { DirectoryItem } from "@ferix/ui/components/directory/directory-item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ferix/ui/components/ui/select";
import { useOptimisticState } from "@ferix/ui/hooks/use-optimistic-state";
import { directories, getDirectoryById } from "@ferix/ui/lib/directories";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface PromptDetailDirectoryProps {
  promptId: Id<"prompts">;
  directoryId?: string;
  isCreator: boolean;
}

export function PromptDetailDirectory({
  promptId,
  directoryId,
  isCreator,
}: PromptDetailDirectoryProps) {
  const t = useTranslations("promptDetail");
  const updateDirectory = useMutation(api.prompts.updateDirectory);

  const {
    current: currentDirectoryId,
    setOptimistic,
    reset,
  } = useOptimisticState(directoryId);

  const currentDirectory = currentDirectoryId
    ? getDirectoryById(currentDirectoryId)
    : null;

  const handleDirectoryChange = async (value: string | null) => {
    const newDirectoryId = value === "none" ? undefined : (value ?? undefined);
    setOptimistic(newDirectoryId);
    try {
      await updateDirectory({
        promptId,
        directoryId: newDirectoryId,
      });
    } catch {
      reset();
      toast.error(t("directoryError"));
    }
  };

  if (isCreator) {
    return (
      <div className="flex flex-col gap-2 border-border border-b p-4">
        <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t("directory")}
        </h3>
        <Select
          onValueChange={handleDirectoryChange}
          value={currentDirectoryId ?? "none"}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {currentDirectory ? (
                <DirectoryItem directory={currentDirectory} />
              ) : (
                t("noDirectory")
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("noDirectory")}</SelectItem>
            {directories.map((directory) => (
              <SelectItem key={directory.id} value={directory.id}>
                <DirectoryItem directory={directory} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (!currentDirectory) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 border-border border-b p-4">
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {t("directory")}
      </h3>
      <a
        className="text-sm hover:underline"
        href={currentDirectory.link}
        rel="noopener noreferrer"
        target="_blank"
      >
        <DirectoryItem directory={currentDirectory} />
      </a>
    </div>
  );
}

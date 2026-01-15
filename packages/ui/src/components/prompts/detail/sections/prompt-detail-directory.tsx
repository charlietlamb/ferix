"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { DirectoryItem } from "@ferix/ui/components/directory/directory-item";
import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ferix/ui/components/ui/select";
import { directories, getDirectoryById } from "@ferix/ui/lib/directories";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface PromptDetailDirectoryProps {
  promptId: Id<"prompts">;
  directoryId?: string;
  isCreator: boolean;
  /** Callback when directory changes (for optimistic updates in parent) */
  onDirectoryChange: (directoryId: string | undefined) => void;
  /** Callback when mutation fails (to rollback optimistic update) */
  onError: () => void;
}

export function PromptDetailDirectory({
  promptId,
  directoryId,
  isCreator,
  onDirectoryChange,
  onError,
}: PromptDetailDirectoryProps) {
  const t = useTranslations("promptDetail");
  const updateDirectory = useMutation(api.prompts.updateDirectory);

  const currentDirectory = directoryId ? getDirectoryById(directoryId) : null;

  const handleDirectoryChange = async (value: string | null) => {
    const newDirectoryId =
      value === "none" || value === null ? undefined : value;

    // Optimistic update
    onDirectoryChange(newDirectoryId);

    try {
      await updateDirectory({ promptId, directoryId: newDirectoryId });
    } catch {
      // Rollback on error
      onError();
      toast.error(t("directoryError"));
    }
  };

  if (isCreator) {
    return (
      <PromptSection title={t("directory")}>
        <Select
          onValueChange={handleDirectoryChange}
          value={directoryId ?? "none"}
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
      </PromptSection>
    );
  }

  if (!currentDirectory) {
    return null;
  }

  return (
    <PromptSection title={t("directory")}>
      <a
        className="text-sm hover:underline"
        href={currentDirectory.link}
        rel="noopener noreferrer"
        target="_blank"
      >
        <DirectoryItem directory={currentDirectory} />
      </a>
    </PromptSection>
  );
}

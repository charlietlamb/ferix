"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
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
            <SelectValue>{t("selectDirectory")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("noDirectory")}</SelectItem>
            {directories.map((directory) => (
              <SelectItem
                className="flex items-center gap-2"
                key={directory.id}
                value={directory.id}
              >
                {/* biome-ignore lint: public svg */}
                <img
                  alt={directory.name}
                  className="size-4 object-contain dark:hidden"
                  height={16}
                  src={directory.lightImageUrl}
                  width={16}
                />
                {/* biome-ignore lint: public svg */}
                <img
                  alt={directory.name}
                  className="hidden size-4 object-contain dark:block"
                  height={16}
                  src={directory.darkImageUrl}
                  width={16}
                />
                {directory.name}
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
        className="flex items-center gap-2 text-sm hover:underline"
        href={currentDirectory.link}
        rel="noopener noreferrer"
        target="_blank"
      >
        {/* biome-ignore lint: public svg */}
        <img
          alt={currentDirectory.name}
          className="size-4 object-contain dark:hidden"
          height={16}
          src={currentDirectory.lightImageUrl}
          width={16}
        />
        {/* biome-ignore lint: public svg */}
        <img
          alt={currentDirectory.name}
          className="hidden size-4 object-contain dark:block"
          height={16}
          src={currentDirectory.darkImageUrl}
          width={16}
        />
        {currentDirectory.name}
      </a>
    </div>
  );
}

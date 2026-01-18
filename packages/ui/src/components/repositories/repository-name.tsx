"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { Input } from "@ferix/ui/components/ui/input";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useAutoSubmitForm } from "@ferix/ui/hooks/use-auto-submit-form";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface RepositoryNameProps {
  repositoryId: string;
  name?: string;
  owner: string;
}

export function RepositoryName({
  repositoryId,
  name,
  owner,
}: RepositoryNameProps) {
  const t = useTranslations("pages.repository");
  const { isAdmin } = useAuthenticated();
  const updateName = useMutation(api.directories.updateName);

  const { value: currentName, setValue: setName } = useAutoSubmitForm({
    initialValue: name ?? "",
    debounceMs: 500,
    onSubmit: async (newName) => {
      try {
        await updateName({
          directoryId: repositoryId as Id<"directories">,
          name: newName.trim() || undefined,
        });
        toast.success(t("nameSaved"));
      } catch {
        toast.error(t("nameError"));
        throw new Error("Failed to update name");
      }
    },
  });

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 border-border border-b px-4 py-3">
      <span className="shrink-0 text-muted-foreground text-sm">
        {t("name")}:
      </span>
      <div className="relative flex-1">
        <Input
          className="h-8 pr-12"
          maxLength={32}
          onChange={(e) => setName(e.target.value)}
          placeholder={owner}
          value={currentName}
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground text-xs">
          {currentName.length}/32
        </span>
      </div>
    </div>
  );
}

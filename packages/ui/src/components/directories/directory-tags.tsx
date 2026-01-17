"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { MultiSelect } from "@ferix/ui/components/ui/multi-select";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useAutoSubmitForm } from "@ferix/ui/hooks/use-auto-submit-form";
import { getTagsByIds, tagsToOptions } from "@ferix/ui/lib/tags";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";

interface DirectoryTagsProps {
  directoryId: string;
  tags: string[];
}

export function DirectoryTags({ directoryId, tags }: DirectoryTagsProps) {
  const t = useTranslations("pages.directory");
  const { isAdmin } = useAuthenticated();
  const updateTags = useMutation(api.directories.updateTags);

  const { value: currentTags, setValue: setTags } = useAutoSubmitForm({
    initialValue: tags,
    onSubmit: async (newTags) => {
      try {
        await updateTags({
          directoryId: directoryId as Id<"directories">,
          tags: newTags,
        });
        toast.success(t("tagsSaved"));
      } catch {
        toast.error(t("tagsError"));
        throw new Error("Failed to update tags");
      }
    },
  });

  const tagOptions = useMemo(() => tagsToOptions(), []);
  const tagObjects = useMemo(() => getTagsByIds(currentTags), [currentTags]);
  const selectedTags = useMemo(
    () =>
      tagObjects.map((tag) => ({
        label: tag.label,
        value: tag.id,
        icon: tag.icon,
        group: tag.category,
      })),
    [tagObjects]
  );

  const handleTagsChange = (newTags: { label: string; value: string }[]) => {
    setTags(newTags.map((tag) => tag.value));
  };

  if (!isAdmin) {
    if (tagObjects.length === 0) {
      return null;
    }

    return (
      <div className="flex items-center gap-2 border-border border-b px-4 py-3">
        <span className="text-muted-foreground text-sm">{t("tags")}:</span>
        <div className="flex flex-wrap gap-2">
          {tagObjects.map((tag) => {
            const Icon = tag.icon;
            return (
              <div
                className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs"
                key={tag.id}
              >
                <Icon size={12} />
                <span>{tag.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-border border-b px-4 py-3">
      <span className="shrink-0 text-muted-foreground text-sm">
        {t("tags")}:
      </span>
      <div className="flex-1">
        <MultiSelect
          dropdownPosition="bottom"
          groupBy
          onChange={handleTagsChange}
          options={tagOptions}
          placeholder={t("selectTags")}
          value={selectedTags}
        />
      </div>
    </div>
  );
}

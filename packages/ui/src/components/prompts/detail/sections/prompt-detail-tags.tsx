"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { MultiSelect } from "@ferix/ui/components/ui/multi-select";
import { useOptimisticState } from "@ferix/ui/hooks/use-optimistic-state";
import { getTagsByIds, tagsToOptions } from "@ferix/ui/lib/tags";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface PromptDetailTagsProps {
  promptId: Id<"prompts">;
  tags: string[];
  isCreator: boolean;
}

export function PromptDetailTags({
  promptId,
  tags,
  isCreator,
}: PromptDetailTagsProps) {
  const t = useTranslations("promptDetail");
  const updateTags = useMutation(api.prompts.updateTags);

  const {
    current: currentTags,
    setOptimistic,
    reset,
  } = useOptimisticState(tags);

  const tagObjects = getTagsByIds(currentTags);
  const tagOptions = tagsToOptions();
  const selectedTags = tagObjects.map((tag) => ({
    label: tag.label,
    value: tag.id,
    icon: tag.icon,
    group: tag.category,
  }));

  const handleTagsChange = async (
    newTags: { label: string; value: string }[]
  ) => {
    const newTagIds = newTags.map((tag) => tag.value);
    setOptimistic(newTagIds);
    try {
      await updateTags({
        promptId,
        tags: newTagIds,
      });
    } catch {
      reset();
      toast.error(t("tagsError"));
    }
  };

  if (isCreator) {
    return (
      <div className="flex flex-col gap-2 border-border border-b p-4">
        <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t("tags")}
        </h3>
        <MultiSelect
          groupBy
          onChange={handleTagsChange}
          options={tagOptions}
          placeholder={t("selectTags")}
          value={selectedTags}
        />
      </div>
    );
  }

  if (tagObjects.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 border-border border-b p-4">
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {t("tags")}
      </h3>
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

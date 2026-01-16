"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { MultiSelect } from "@ferix/ui/components/ui/multi-select";
import { useAutoSubmitForm } from "@ferix/ui/hooks/use-auto-submit-form";
import { getTagsByIds, tagsToOptions } from "@ferix/ui/lib/tags";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";

interface PromptDetailTagsProps {
  promptId: Id<"prompts">;
  tags: string[];
  canEdit: boolean;
}

export function PromptDetailTags({
  promptId,
  tags,
  canEdit,
}: PromptDetailTagsProps) {
  const t = useTranslations("promptDetail");
  const updateTags = useMutation(api.prompts.updateTags);

  const { value: currentTags, setValue: setTags } = useAutoSubmitForm({
    initialValue: tags,
    onSubmit: async (newTags) => {
      try {
        await updateTags({ promptId, tags: newTags });
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

  if (canEdit) {
    return (
      <PromptSection title={t("tags")}>
        <MultiSelect
          groupBy
          onChange={handleTagsChange}
          options={tagOptions}
          placeholder={t("selectTags")}
          value={selectedTags}
        />
      </PromptSection>
    );
  }

  if (tagObjects.length === 0) {
    return null;
  }

  return (
    <PromptSection title={t("tags")}>
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
    </PromptSection>
  );
}

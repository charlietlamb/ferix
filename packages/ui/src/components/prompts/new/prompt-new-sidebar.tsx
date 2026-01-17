"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { MultiSelect } from "@ferix/ui/components/ui/multi-select";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { getTagsByIds, tagsToOptions } from "@ferix/ui/lib/tags";
import { useTranslations } from "next-intl";

interface PromptNewSidebarProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  canCreate: boolean;
  isCreating: boolean;
  onCreate: () => void;
}

export function PromptNewSidebar({
  tags,
  onTagsChange,
  canCreate,
  isCreating,
  onCreate,
}: PromptNewSidebarProps) {
  const t = useTranslations("promptNew");

  const tagObjects = getTagsByIds(tags);
  const tagOptions = tagsToOptions();
  const selectedTags = tagObjects.map((tag) => ({
    label: tag.label,
    value: tag.id,
    icon: tag.icon,
    group: tag.category,
  }));

  const handleTagsChange = (newTags: { label: string; value: string }[]) => {
    onTagsChange(newTags.map((tag) => tag.value));
  };

  return (
    <aside className="flex flex-col border-border border-t md:w-[320px] md:shrink-0 md:overflow-auto md:border-t-0 md:border-l">
      <div className="flex flex-col gap-2 border-border border-b p-4">
        <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t("tags")}
        </h3>
        <MultiSelect
          dropdownPosition="top"
          groupBy
          onChange={handleTagsChange}
          options={tagOptions}
          placeholder={t("tagsPlaceholder")}
          value={selectedTags}
        />
      </div>
      <div className="p-4">
        <Button
          className="w-full"
          disabled={!canCreate || isCreating}
          onClick={onCreate}
        >
          {isCreating ? (
            <>
              <Spinner className="mr-2" />
              {t("creating")}
            </>
          ) : (
            t("create")
          )}
        </Button>
      </div>
    </aside>
  );
}

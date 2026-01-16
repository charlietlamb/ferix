"use client";

import { DirectoryItem } from "@ferix/ui/components/directory/directory-item";
import { Button } from "@ferix/ui/components/ui/button";
import { MultiSelect } from "@ferix/ui/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ferix/ui/components/ui/select";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { directories, getDirectoryById } from "@ferix/ui/lib/directories";
import { getTagsByIds, tagsToOptions } from "@ferix/ui/lib/tags";
import { useTranslations } from "next-intl";

interface PromptNewSidebarProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  directoryId?: string;
  onDirectoryChange: (directoryId: string | undefined) => void;
  canCreate: boolean;
  isCreating: boolean;
  onCreate: () => void;
}

export function PromptNewSidebar({
  tags,
  onTagsChange,
  directoryId,
  onDirectoryChange,
  canCreate,
  isCreating,
  onCreate,
}: PromptNewSidebarProps) {
  const t = useTranslations("promptNew");
  const { isAdmin } = useAuthenticated();

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

  const handleDirectoryChange = (value: string | null) => {
    onDirectoryChange(value === "none" ? undefined : (value ?? undefined));
  };

  const currentDirectory = directoryId ? getDirectoryById(directoryId) : null;

  return (
    <aside className="flex flex-col border-border border-t md:w-[320px] md:shrink-0 md:overflow-auto md:border-t-0 md:border-l">
      <div className="flex flex-col gap-2 border-border border-b p-4">
        <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t("tags")}
        </h3>
        <MultiSelect
          dropdownPosition="bottom"
          groupBy
          onChange={handleTagsChange}
          options={tagOptions}
          placeholder={t("tagsPlaceholder")}
          value={selectedTags}
        />
      </div>
      {isAdmin && (
        <div className="flex flex-col gap-2 border-border border-b p-4">
          <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {t("directory")}
          </h3>
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
        </div>
      )}
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

"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { Button } from "@ferix/ui/components/ui/button";
import { Input } from "@ferix/ui/components/ui/input";
import { useInlineEdit } from "@ferix/ui/hooks/use-inline-edit";
import {
  CheckIcon,
  LinkIcon,
  PencilSimpleIcon,
  SpinnerIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import slugify from "slugify";
import { toast } from "sonner";

interface PromptDetailUrlEditorProps {
  promptId: Id<"prompts">;
  slug: string;
  title: string;
}

export function PromptDetailUrlEditor({
  promptId,
  slug,
  title,
}: PromptDetailUrlEditorProps) {
  const t = useTranslations("promptDetail");
  const router = useRouter();
  const renamePrompt = useMutation(api.prompts.rename);

  const slugEdit = useInlineEdit({
    initialValue: slug,
    onSave: async (newSlug) => {
      try {
        await renamePrompt({
          promptId,
          title,
          slug: newSlug.trim(),
        });
        toast.success(t("slugSaved"));
        router.replace(`/prompt/${newSlug.trim()}`);
      } catch {
        toast.error(t("slugError"));
        throw new Error("Save failed");
      }
    },
    validate: (value) => value.trim() !== "",
  });

  if (slugEdit.isEditing) {
    return (
      <div className="flex flex-col gap-2 border-border border-b p-4">
        <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t("url")}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-md border bg-muted/50 px-2">
            <span className="text-muted-foreground text-xs">/prompt/</span>
            <Input
              autoFocus
              className="h-7 border-0 bg-transparent px-0 text-xs focus-visible:ring-0 md:text-xs"
              disabled={slugEdit.isSaving}
              onChange={(e) =>
                slugEdit.setValue(
                  slugify(e.target.value, { lower: true, strict: true })
                )
              }
              onKeyDown={slugEdit.handleKeyDown}
              placeholder="slug"
              value={slugEdit.value}
            />
          </div>
          <Button
            className="size-7"
            disabled={slugEdit.isSaving || !slugEdit.value.trim()}
            onClick={slugEdit.save}
            size="icon"
            variant="ghost"
          >
            {slugEdit.isSaving ? (
              <SpinnerIcon className="size-3.5 animate-spin" />
            ) : (
              <CheckIcon className="size-3.5" />
            )}
          </Button>
          <Button
            className="size-7"
            disabled={slugEdit.isSaving}
            onClick={slugEdit.cancel}
            size="icon"
            variant="ghost"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-border border-b p-4">
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {t("url")}
      </h3>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center">
          <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate pl-1 text-muted-foreground">/prompt/</span>
          <span className="truncate">{slug}</span>
        </div>
        <Button
          className="size-7 shrink-0"
          onClick={slugEdit.startEditing}
          size="icon"
          variant="ghost"
        >
          <PencilSimpleIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

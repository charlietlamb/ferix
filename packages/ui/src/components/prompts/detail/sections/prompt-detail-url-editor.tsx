"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { Button } from "@ferix/ui/components/ui/button";
import { Input } from "@ferix/ui/components/ui/input";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import {
  CheckIcon,
  LinkIcon,
  PencilSimpleIcon,
  SpinnerIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
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
  const [isEditing, setIsEditing] = useState(false);

  const form = useAppForm({
    defaultValues: { slug },
    onSubmit: async ({ value }) => {
      const newSlug = value.slug.trim();

      // Skip if unchanged
      if (newSlug === slug) {
        setIsEditing(false);
        return;
      }

      try {
        await renamePrompt({
          promptId,
          title,
          slug: newSlug,
        });
        toast.success(t("slugSaved"));
        setIsEditing(false);
        router.replace(`/prompt/${newSlug}`);
      } catch (error) {
        const isConflict =
          error instanceof Error &&
          error.message.includes("Slug already exists");
        toast.error(isConflict ? t("slugConflict") : t("slugError"));
      }
    },
  });

  const startEditing = useCallback(() => {
    form.reset();
    setIsEditing(true);
  }, [form]);

  const cancel = useCallback(() => {
    form.reset();
    setIsEditing(false);
  }, [form]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit();
      } else if (e.key === "Escape") {
        cancel();
      }
    },
    [form, cancel]
  );

  if (isEditing) {
    return (
      <PromptSection title={t("url")}>
        <form.Subscribe
          selector={(state) => ({
            value: state.values.slug,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ value, isSubmitting }) => (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-md border bg-muted/50 px-2">
                <span className="text-muted-foreground text-xs">/prompt/</span>
                <Input
                  autoFocus
                  className="h-7 border-0 bg-transparent px-0 text-xs focus-visible:ring-0 md:text-xs"
                  disabled={isSubmitting}
                  onChange={(e) =>
                    form.setFieldValue(
                      "slug",
                      slugify(e.target.value, { lower: true, strict: true })
                    )
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="slug"
                  value={value}
                />
              </div>
              <Button
                className="size-7"
                disabled={isSubmitting || !value.trim()}
                onClick={() => form.handleSubmit()}
                size="icon"
                type="button"
                variant="ghost"
              >
                {isSubmitting ? (
                  <SpinnerIcon className="size-3.5 animate-spin" />
                ) : (
                  <CheckIcon className="size-3.5" />
                )}
              </Button>
              <Button
                className="size-7"
                disabled={isSubmitting}
                onClick={cancel}
                size="icon"
                type="button"
                variant="ghost"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          )}
        </form.Subscribe>
      </PromptSection>
    );
  }

  return (
    <PromptSection title={t("url")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center">
          <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate pl-1 text-muted-foreground">/prompt/</span>
          <span className="truncate">{slug}</span>
        </div>
        <Button
          className="size-7 shrink-0"
          onClick={startEditing}
          size="icon"
          variant="ghost"
        >
          <PencilSimpleIcon className="size-3.5" />
        </Button>
      </div>
    </PromptSection>
  );
}

"use client";

import { useTrack } from "@ferix/analytics/use-track";
import { useRouter } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { Button } from "@ferix/ui/components/ui/button";
import { SaveButton } from "@ferix/ui/components/utils/save-button";
import { useAutoSubmitForm } from "@ferix/ui/hooks/use-auto-submit-form";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import {
  CheckIcon,
  CopyIcon,
  LinkIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface PromptDetailActionsProps {
  promptId: Id<"prompts">;
  content: string;
  slug: string;
  title?: string;
  isSaved: boolean;
  canEdit: boolean;
}

export function PromptDetailActions({
  promptId,
  content,
  slug,
  title,
  isSaved,
  canEdit,
}: PromptDetailActionsProps) {
  const t = useTranslations("promptDetail");
  const router = useRouter();
  const { open: openDialog } = useDialog();
  const removePrompt = useMutation(api.prompts.remove);
  const recordDownload = useMutation(api.prompts.recordDownload);
  const { copy, copied } = useCopy();
  const { copy: copyLink, copied: linkCopied } = useCopy();
  const { trackPromptDownload, trackPromptLinkCopy } = useTrack();

  // Optimistic state for save status
  const { value: currentlySaved, setValue: setOptimisticSaved } =
    useAutoSubmitForm({
      initialValue: isSaved,
      onSubmit: async () => {
        // The actual mutation is handled by SaveButton
        // This hook just provides optimistic state
      },
    });

  const handleCopy = () => {
    if (!copied) {
      recordDownload({ promptId });
      copy(content);
      trackPromptDownload({
        promptId,
        promptSlug: slug,
        promptTitle: title,
      });
    }
  };

  const handleCopyLink = () => {
    if (!linkCopied) {
      copyLink(`${window.location.origin}/prompt/${slug}`);
      trackPromptLinkCopy({
        promptId,
        promptSlug: slug,
      });
    }
  };

  const handleDelete = () => {
    openDialog("confirmDialog", {
      title: t("deleteConfirm.title"),
      description: t("deleteConfirm.description"),
      confirmLabel: t("delete"),
      variant: "destructive",
      onConfirm: async () => {
        await removePrompt({ promptId });
        toast.success(t("deleteSuccess"));
        router.push("/");
      },
    });
  };

  return (
    <PromptSection border={false} title={t("actions")}>
      <div className="flex flex-col gap-2">
        <Button
          className="w-full justify-start"
          onClick={handleCopy}
          variant="outline"
        >
          {copied ? (
            <CheckIcon className="mr-2 size-4 text-green-500" />
          ) : (
            <CopyIcon className="mr-2 size-4" />
          )}
          {t("copy")}
        </Button>
        <Button
          className="w-full justify-start"
          onClick={handleCopyLink}
          variant="outline"
        >
          {linkCopied ? (
            <CheckIcon className="mr-2 size-4 text-green-500" />
          ) : (
            <LinkIcon className="mr-2 size-4" />
          )}
          {t("copyLink")}
        </Button>
        <SaveButton
          isSaved={currentlySaved}
          label={{ save: t("save"), unsave: t("unsave") }}
          onOptimisticUpdate={setOptimisticSaved}
          promptId={promptId}
          variant="button"
        />
        {canEdit && (
          <Button
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleDelete}
            variant="outline"
          >
            <TrashIcon className="mr-2 size-4" />
            {t("delete")}
          </Button>
        )}
      </div>
    </PromptSection>
  );
}

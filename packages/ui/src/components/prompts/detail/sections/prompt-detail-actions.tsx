"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { Button } from "@ferix/ui/components/ui/button";
import { SaveButton } from "@ferix/ui/components/utils/save-button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useOptimisticState } from "@ferix/ui/hooks/use-optimistic-state";
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
  isSaved: boolean;
  isCreator: boolean;
}

export function PromptDetailActions({
  promptId,
  content,
  slug,
  isSaved,
  isCreator,
}: PromptDetailActionsProps) {
  const t = useTranslations("promptDetail");
  const router = useRouter();
  const { open: openDialog } = useDialog();
  const removePrompt = useMutation(api.prompts.remove);
  const recordDownload = useMutation(api.prompts.recordDownload);
  const { copy, copied } = useCopy();
  const { copy: copyLink, copied: linkCopied } = useCopy();

  const { current: currentlySaved, setOptimistic: setOptimisticSaved } =
    useOptimisticState(isSaved);

  const handleCopy = () => {
    if (!copied) {
      recordDownload({ promptId });
      copy(content);
    }
  };

  const handleCopyLink = () => {
    if (!linkCopied) {
      copyLink(`${window.location.origin}/prompt/${slug}`);
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
    <div className="flex flex-col gap-2 p-4">
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {t("actions")}
      </h3>
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
        {isCreator && (
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
    </div>
  );
}

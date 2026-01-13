"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { PromptDetailSection } from "@ferix/ui/components/prompts/detail/prompt-detail-section";
import { Button } from "@ferix/ui/components/ui/button";
import { SaveButton } from "@ferix/ui/components/utils/save-button";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useOptimisticState } from "@ferix/ui/hooks/use-optimistic-state";
import { TrashIcon } from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface PromptDetailActionsProps {
  promptId: Id<"prompts">;
  isSaved: boolean;
  isCreator: boolean;
}

export function PromptDetailActions({
  promptId,
  isSaved,
  isCreator,
}: PromptDetailActionsProps) {
  const t = useTranslations("promptDetail");
  const router = useRouter();
  const { open: openDialog } = useDialog();
  const removePrompt = useMutation(api.prompts.remove);

  const { current: currentlySaved, setOptimistic: setOptimisticSaved } =
    useOptimisticState(isSaved);

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
    <PromptDetailSection className="border-none" title={t("actions")}>
      <div className="flex flex-col gap-2">
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
    </PromptDetailSection>
  );
}

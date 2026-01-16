"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { PromptTypeSelect } from "@ferix/ui/components/prompts/shared/prompt-type-select";
import { TypeBadge } from "@ferix/ui/components/prompts/shared/type-badge";
import { useOptimisticState } from "@ferix/ui/hooks/use-optimistic-state";
import type { PromptType } from "@ferix/ui/lib/prompt-types";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface PromptDetailTypeProps {
  promptId: Id<"prompts">;
  type: PromptType;
  canEdit: boolean;
}

export function PromptDetailType({
  promptId,
  type,
  canEdit,
}: PromptDetailTypeProps) {
  const t = useTranslations("promptDetail");
  const updateType = useMutation(api.prompts.updateType);

  const {
    current: currentType,
    setOptimistic,
    reset,
  } = useOptimisticState(type);

  const handleTypeChange = async (newType: PromptType) => {
    if (newType === currentType) {
      return;
    }

    setOptimistic(newType);
    try {
      await updateType({ promptId, type: newType });
      toast.success(t("typeSaved"));
    } catch {
      reset();
      toast.error(t("typeError"));
    }
  };

  if (canEdit) {
    return (
      <PromptSection title={t("type")}>
        <PromptTypeSelect onChange={handleTypeChange} value={currentType} />
      </PromptSection>
    );
  }

  return (
    <PromptSection title={t("type")}>
      <TypeBadge type={currentType} />
    </PromptSection>
  );
}

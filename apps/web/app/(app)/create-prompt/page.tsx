"use client";

import { PromptDetailSkeleton } from "@ferix/ui/components/prompts/detail/prompt-detail-skeleton";
import { PromptNewAuthGuard } from "@ferix/ui/components/prompts/new/prompt-new-auth-guard";
import { PromptNewPage } from "@ferix/ui/components/prompts/new/prompt-new-page";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";

export default function CreatePromptPage() {
  const { isAuthenticated, isPending } = useAuthenticated();

  if (isPending) {
    return <PromptDetailSkeleton />;
  }

  if (!isAuthenticated) {
    return <PromptNewAuthGuard />;
  }

  return <PromptNewPage />;
}

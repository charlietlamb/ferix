"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptDetailPage } from "@ferix/ui/components/prompts/detail/prompt-detail-page";
import { PromptDetailSkeleton } from "@ferix/ui/components/prompts/detail/prompt-detail-skeleton";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";
import { useRef } from "react";

interface PromptPageClientProps {
  slug: string;
}

export function PromptPageClient({ slug }: PromptPageClientProps) {
  const prompt = useQuery(api.prompts.getBySlug, { slug });
  const hadPromptRef = useRef(false);

  if (prompt === undefined) {
    return <PromptDetailSkeleton />;
  }

  if (prompt) {
    hadPromptRef.current = true;
  }

  if (prompt === null) {
    if (hadPromptRef.current) {
      return <PromptDetailSkeleton />;
    }
    notFound();
  }

  return <PromptDetailPage prompt={prompt} />;
}

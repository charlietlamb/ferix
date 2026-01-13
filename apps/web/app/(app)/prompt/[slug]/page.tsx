"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptDetailPage } from "@ferix/ui/components/prompts/detail/prompt-detail-page";
import { PromptDetailSkeleton } from "@ferix/ui/components/prompts/detail/prompt-detail-skeleton";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";
import { use, useRef } from "react";

interface PromptPageProps {
  params: Promise<{ slug: string }>;
}

export default function PromptPage({ params }: PromptPageProps) {
  const { slug } = use(params);
  const prompt = useQuery(api.prompts.getBySlug, { slug });
  const hadPromptRef = useRef(false);

  // Loading state
  if (prompt === undefined) {
    return <PromptDetailSkeleton />;
  }

  // Track that we've successfully loaded a prompt
  if (prompt) {
    hadPromptRef.current = true;
  }

  // Prompt not found - show skeleton if navigating, 404 if fresh load
  if (prompt === null) {
    if (hadPromptRef.current) {
      return <PromptDetailSkeleton />;
    }
    notFound();
  }

  return <PromptDetailPage prompt={prompt} />;
}

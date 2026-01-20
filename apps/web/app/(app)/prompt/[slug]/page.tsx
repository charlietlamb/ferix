import { api } from "@ferix/server/_generated/api";
import type { Metadata } from "next";
import { convexServer } from "@/lib/convex";
import { buildOgMetadata } from "@/lib/og";
import { PromptPageClient } from "./prompt-page-client";

interface PromptPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PromptPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const prompt = await convexServer.query(api.prompts.getBySlug, { slug });

    if (!prompt) {
      return { title: "Prompt Not Found" };
    }

    const ogParams: Record<string, string> = { title: prompt.title };
    if (prompt.directory) {
      ogParams.owner = prompt.directory.owner;
      ogParams.repo = prompt.directory.repo;
    } else if (prompt.creator) {
      if (prompt.creator.username) {
        ogParams.username = prompt.creator.username;
      }
      if (prompt.creator.image) {
        ogParams.image = prompt.creator.image;
      }
    }

    return buildOgMetadata({
      title: prompt.title,
      description: prompt.content?.slice(0, 160) || `${prompt.title} on Ferix`,
      ogPath: "/api/og/prompt",
      params: ogParams,
      canonicalPath: `/prompt/${slug}`,
    });
  } catch {
    return { title: "Prompt" };
  }
}

export default async function PromptPage({ params }: PromptPageProps) {
  const { slug } = await params;
  return <PromptPageClient slug={slug} />;
}

import { getTagById } from "@ferix/ui/lib/tags";
import type { Metadata } from "next";
import { TagPageClient } from "./tag-page-client";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag: tagId } = await params;
  const tag = getTagById(tagId);

  const title = tag?.label || tagId;
  const description = `Discover AI agent skills and prompts for ${title}. Find configurations and rules for Claude, Cursor, and other AI coding assistants.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/tag/${tagId}`,
    },
    openGraph: {
      title: `${title} Skills`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} Skills`,
      description,
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;

  return <TagPageClient tag={tag} />;
}

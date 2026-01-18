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
  const description = `Skills and prompts for ${title} on Ferix`;

  return {
    title,
    description,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;

  return <TagPageClient tag={tag} />;
}

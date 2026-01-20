import type { Metadata } from "next";
import { TagsPageClient } from "./tags-page-client";

export const metadata: Metadata = {
  title: "Tags",
  description:
    "Browse AI agent skills by category. Find prompts and configurations organized by tags for Claude, Cursor, and other AI assistants.",
  alternates: {
    canonical: "/tags",
  },
};

export default function TagsPage() {
  return <TagsPageClient />;
}

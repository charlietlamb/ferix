import type { Metadata } from "next";
import { RepositoriesPageClient } from "./repositories-page-client";

export const metadata: Metadata = {
  title: "Repositories",
  description:
    "Explore GitHub repositories with AI agent skills and prompts. Sync and discover prompt collections for Claude, Cursor, and other AI coding assistants.",
  alternates: {
    canonical: "/repositories",
  },
};

export default function RepositoriesPage() {
  return <RepositoriesPageClient />;
}

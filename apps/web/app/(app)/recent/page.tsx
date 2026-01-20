import type { Metadata } from "next";
import { RecentPageClient } from "./recent-page-client";

export const metadata: Metadata = {
  title: "Recent Skills",
  description:
    "Browse the latest AI agent skills and prompts added to Ferix. Stay updated with new configurations for Claude, Cursor, and other AI assistants.",
  alternates: {
    canonical: "/recent",
  },
};

export default function RecentPage() {
  return <RecentPageClient />;
}

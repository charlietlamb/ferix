import type { Metadata } from "next";
import { PopularPageClient } from "./popular-page-client";

export const metadata: Metadata = {
  title: "Popular Skills",
  description:
    "Discover the most popular AI agent skills and prompts on Ferix. Find trending configurations for Claude, Cursor, and other AI coding assistants.",
  alternates: {
    canonical: "/popular",
  },
};

export default function PopularPage() {
  return <PopularPageClient />;
}

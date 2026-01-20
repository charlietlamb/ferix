import type { Metadata } from "next";
import { CreatePromptPageClient } from "./create-prompt-page-client";

export const metadata: Metadata = {
  title: "Create Skill",
  description: "Create and share a new AI agent skill or prompt on Ferix.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreatePromptPage() {
  return <CreatePromptPageClient />;
}

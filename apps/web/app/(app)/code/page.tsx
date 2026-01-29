import { CodeArchitecture } from "@ferix/ui/components/code/code-architecture";
import { CodeDocs } from "@ferix/ui/components/code/code-docs";
import { CodeHero } from "@ferix/ui/components/code/code-hero";
import { LogoSection } from "@ferix/ui/components/home/logo/logo-section";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FerixCode - AI-Powered CLI",
  description:
    "A powerful CLI for development with Ralph loops. Built on top of Claude, Cursor & OpenCode.",
  alternates: {
    canonical: "/code",
  },
};

export default function CodePage() {
  return (
    <AppPage className="scrollbar-none h-auto overflow-visible">
      <CodeHero />
      <CodeDocs />
      <CodeArchitecture />
      <LogoSection />
    </AppPage>
  );
}

import { SyncDocs } from "@ferix/ui/components/code/sync-docs";
import { SyncHero } from "@ferix/ui/components/code/sync-hero";
import { LogoSection } from "@ferix/ui/components/home/logo/logo-section";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ferix Sync - Auto-Install Skills",
  description:
    "Auto-discover and install skills from your project dependencies with a single command.",
  alternates: {
    canonical: "/sync",
  },
};

export default function SyncPage() {
  return (
    <AppPage className="scrollbar-none h-auto overflow-visible">
      <SyncHero />
      <SyncDocs />
      <LogoSection />
    </AppPage>
  );
}

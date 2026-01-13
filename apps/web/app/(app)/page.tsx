import { AppPage } from "@ferix/ui/components/layout/app-page";
import { PopularPrompts } from "@ferix/ui/components/prompts/data/popular-prompts";
import { RecentPrompts } from "@ferix/ui/components/prompts/data/recent-prompts";
import { HeroSection } from "./hero/hero-section";

export default function DashboardPage() {
  return (
    <AppPage className="scrollbar-none">
      <HeroSection />
      <PopularPrompts />
      <RecentPrompts />
    </AppPage>
  );
}

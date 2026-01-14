import { AppPage } from "@ferix/ui/components/layout/app-page";
import { PopularPrompts } from "@ferix/ui/components/prompts/data/popular-prompts";
import { RecentPrompts } from "@ferix/ui/components/prompts/data/recent-prompts";
import { CategoryGrid } from "@/components/home/categories/category-grid";
import { CTASection } from "@/components/home/cta/cta-section";
import { HeroSection } from "@/components/home/hero/hero-section";
import { LogoSection } from "@/components/home/logo/logo-section";
import { StatsSection } from "@/components/home/stats/stats-section";

export default function DashboardPage() {
  return (
    <AppPage className="scrollbar-none h-auto overflow-visible">
      <HeroSection />
      <PopularPrompts />
      <StatsSection />
      <RecentPrompts />
      <CategoryGrid />
      <CTASection />
      <LogoSection />
    </AppPage>
  );
}

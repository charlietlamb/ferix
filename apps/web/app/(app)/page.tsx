import { CategoryGrid } from "@ferix/ui/components/home/categories/category-grid";
import { CTASection } from "@ferix/ui/components/home/cta/cta-section";
import { DirectoryGrid } from "@ferix/ui/components/home/directories/directory-grid";
import { Gutter } from "@ferix/ui/components/home/gutter";
import { HeroSection } from "@ferix/ui/components/home/hero/hero-section";
import { LogoSection } from "@ferix/ui/components/home/logo/logo-section";
import { SearchSection } from "@ferix/ui/components/home/search/search-section";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import { PopularPrompts } from "@ferix/ui/components/prompts/data/popular-prompts";
import { RecentPrompts } from "@ferix/ui/components/prompts/data/recent-prompts";

export default function DashboardPage() {
  return (
    <AppPage className="scrollbar-none h-auto overflow-visible">
      <HeroSection />
      <SearchSection />
      <DirectoryGrid />
      <Gutter />
      <PopularPrompts />
      <Gutter />
      {/* <StatsSection /> */}
      <RecentPrompts />
      <Gutter />
      <CategoryGrid />
      <Gutter />
      <CTASection />
      <Gutter />
      <LogoSection />
    </AppPage>
  );
}

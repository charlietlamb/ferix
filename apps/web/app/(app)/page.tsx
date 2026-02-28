import { CategoryGrid } from "@ferix/ui/components/home/categories/category-grid";
import { CTASection } from "@ferix/ui/components/home/cta/cta-section";
import { Gutter } from "@ferix/ui/components/home/gutter";
import { HeroSection } from "@ferix/ui/components/home/hero/hero-section";
import { LogoSection } from "@ferix/ui/components/home/logo/logo-section";
import { RepositoryGrid } from "@ferix/ui/components/home/repositories/repository-grid";
import { SearchSection } from "@ferix/ui/components/home/search/search-section";
import { TwitterGrid } from "@ferix/ui/components/home/twitter/twitter-grid";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import { PopularPrompts } from "@ferix/ui/components/prompts/data/popular-prompts";
import { RecentPrompts } from "@ferix/ui/components/prompts/data/recent-prompts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <AppPage className="scrollbar-none h-auto overflow-visible">
      <HeroSection />
      <SearchSection />
      <Gutter />
      <RepositoryGrid />
      <Gutter />
      {/* MCP hidden for now - components preserved */}
      {/* <McpServerGrid /> */}
      {/* <Gutter /> */}
      <PopularPrompts />
      <Gutter />
      {/* <StatsSection /> */}
      <RecentPrompts />
      <Gutter />
      <CategoryGrid />
      <Gutter />
      <TwitterGrid />
      <Gutter />
      <CTASection />
      <Gutter />
      <LogoSection />
    </AppPage>
  );
}

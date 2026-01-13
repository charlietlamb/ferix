import { PopularPrompts } from "@ferix/ui/components/prompts/popular-prompts";
import { RecentPrompts } from "@ferix/ui/components/prompts/recent-prompts";
import { HeroSection } from "./hero/hero-section";

export default function DashboardPage() {
  return (
    <div className="scrollbar-none">
      <HeroSection />
      <PopularPrompts />
      <RecentPrompts />
    </div>
  );
}
